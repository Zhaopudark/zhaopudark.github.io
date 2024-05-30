---
abbrlink: 9f6c2fd1
categories: Personal Experiences
date: "2023-10-25 16:22:37"
tags:
- Machine Learning
- Computer Vision
title: How to Compile TensorFlow-GPU both on Linux (WSL2) and Window
updated: "2024-05-30 16:11:31"
---

This article record some key procedures for me to compile
[TensorFlow](https://www.tensorflow.org/)-GPU on Linux
([WSL2](https://learn.microsoft.com/en-us/windows/wsl/about)) and on
Windows. Because of the convenience of
[MiniConda](https://docs.conda.io/en/latest/miniconda.html), we can
abstract the compiling process into a number of steps that are almost
independent of the operating system (platform). Therefore, this article
is not a rehash of the official or third-party compiling process
available online, but a new integration basing on Conda tools, getting
rid of those tedious and annoying steps in those tutorials and furtherly
simplifying the whole process. To reduce ambiguities, “user names” in
this article will be replaced by `<username>` or `<wsl_username>` ,
e.g. a user folder `C:\Users\bob` will be modified to
`C:\Users\<username>`.

NOTICE: In order to reflect the light-platform-dependence of the
compiling process, the concreate details in different platforms of a
same abstracted procedure will be given out simultaneously. This may be
totally different from those usual tutorials that give out procedures of
a same platform in succession without breaking them up. So, the content
of this article may make readers feel uncomfortable because they need to
keep an eye on the platform switch at all times. However, we still wish
to organize the text in this way to reflect the
light-platform-dependence of the compiling process, and to reveal the
core concepts or procedures of compilation.

<!-- more -->

# Preamble

This preface is not very important and can be skipped.

Scientific research in the field of machine learning and deep learning
has always been limited by hardware and software providers. On the
aspect of open-source framework, we usually cannot get the newest and
stable features because of our using platforms may be not supported by
contributors, which undoubtedly has a negative effect on the progress of
scientific research. I always hope that the compiling and usage of
open-source frameworks can be more and more convenient, so that each of
us researchers can put more energy into the research itself, rather than
the usage of tools, and can in turn promote the development of the
community to speed up the support for new features and new platforms,
making a win-win cycle of positive feedback.

The compiling procedures are nothing but sources, environment and
operations. The environment is the most difficult place to control,
which may be the key point for successful compiling. My using
environment may be not the same to that in official tutorials and may be
not the same to the readers of this article. So the real purpose of this
article is to abstract and document the key steps of the compiling
process to illustrate a whole compiling procedure in a specific
environment. This paper does not guarantee, nor is it necessary to
guarantee, that the process will succeed in other environment, because
we are supposed to obtain the essence through the phenomenon, grasp the
core principles of compiling, and solve the problems in our own
environment.

Therefore, this article will divide the compiling procedures into
`preparing`, `compiling` and `troubleshooting`. We cannot guarantee that
all operations are ablation-tested, so there may be some redundant
operations. Hope you readers can go through these processes and compile
successfully in your own environment.

# Preparing

At first, we make some statements on crucial environment components or
tools and their versions. We try to ensure these stuffs’ versions are as
new as possible, but not necessarily the latest versions, because the
latest versions may incur compatibility issues. For example, see
[here](https://developer.nvidia.com/rdp/cudnn-download), before
`2022/12/18`, the latest `cudnn8.7.0.84` does not support `cuda12.0`, so
we can only use `cuda11.8` to make it compatible with `cudnn8.7.0.84`.
Additionally, see
[here](https://github.com/tensorflow/tensorflow/releases/tag/v2.11.0#:~:text=TF%20pip%3A,TensorFlow%20in%20WSL2.)
that start in `TensorFlow2.11`, CUDA build is not supported for Windows,
so we can only use and build `TensorFlow-GPU2.10.1` on Win11 platform.

The crucial environment statements are as the following:

{% tabs environment statements %}

<!-- tab On WSL2 -->

- `shell` : bash
- `gcc` tool chain: 11.3.0 (Ubuntu 11.3.0-1ubuntu1~22.04)
- `cuda` with toolkits: 11.8.0
- `cudnn`: 8.7.0.84
- `bazel`: 5.2
- `Python`：3.10
- `TensorFlow`: 2.11

<!-- endtab -->
<!-- tab On Win11 -->

- `shell`: PowerShell 7.3
- `msvc` tool chain: MSVC v143 (14.34.31933)
- `windows 11` sdk: 10.0.22621.0
- `cuda` with toolkits: 11.8.0
- `cudnn`: 8.7.0.84
- `bazel`: 5.2
- `Python`：3.10
- `TensorFlow`: 2.10

<!-- endtab -->

{% endtabs %}

Then, we can install and configure essential environment components or
tools, including but not limited to `conda`, `cuda`, `cudnn` and
`bazel`. We assume that all the following operations are based on a
conda environment named `compile`.

## Install and configure `conda (Miniconda)`

With the help of conda
([MiniConda](https://docs.conda.io/en/latest/miniconda.html)), we can
easily compile TensorFlow-GPU on both WSL2 and Win11 in a very similar
way. So the first target is to install and use conda on these 2
platforms.

{% tabs Install and configure `conda (Miniconda)` %}

<!-- tab On WSL2 -->

Create a conda env named `compile` as:

``` bash
conda clean --all # clean is a good way to reduce chance of encountering weird bugs
conda create -n compile python=3.10
conda activate compile
```

<!-- endtab -->
<!-- tab On Win11 -->

Create a conda env named `compile` as:

``` powershell
conda clean --all # clean is a good way to reduce chance of encountering weird bugs
conda create -n compile python=3.10
conda activate compile
```

<!-- endtab -->

{% endtabs %}

We can also refer to [Miniconda — conda
documentation](https://docs.conda.io/en/latest/miniconda.html) for more
details.

## Install and configure `cuda` by conda

The total official tutorials can be found in [CUDA Quick Start
Guide](https://docs.nvidia.com/cuda/cuda-quick-start-guide/) or [CUDA
Toolkit Documentation](https://docs.nvidia.com/cuda/).

{% tabs Install and configure `cuda` by conda%}

<!-- tab On WSL2 -->

We can refer to
[cuda-installation-guide-linux](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#conda-installation).

- Install gcc tools set as:

  ``` bash
  sudo apt install build-essential
  ```

- Install cuda by NVIDIA’s channel:

  ``` bash
  conda activate compile
  conda install cuda -c nvidia/label/cuda-11.8.0
  ```

- Add cuda components into `$PATH` and `$LD_LIBRARY_PATH`. Here we make
  full use of conda’s independent environment variable configuration
  mechanism as
  [here](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#saving-environment-variables):

  ``` bash
  cd $CONDA_PREFIX
  mkdir -p ./etc/conda/activate.d # `-p` is for multi-level directory
  mkdir -p ./etc/conda/deactivate.d 
  touch ./etc/conda/activate.d/env_activate.sh
  touch ./etc/conda/deactivate.d/env_deactivate.sh
  ```

  Edit the above 2 scripts, such as:

  ``` bash
  code ./etc/conda
  ```

  Edit `$CONDA_PREFIX/etc/conda/activate.d/env_activate.sh` as follows:

  ``` bash
  # For cuda-sample tests
  export CUDA_PATH_CONDA_BACKUP="${CUDA_PATH:-}"
  export CUDA_PATH=$CONDA_PREFIX

  export LD_LIBRARY_PATH_CONDA_BACKUP="${LD_LIBRARY_PATH:-}"
  export LD_LIBRARY_PATH=$CONDA_PREFIX/lib${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}

  # Set TF_CUDA_PATHS
  # See line 570 **\third_party\gpus\find_cuda_config.py  
  # the function find_cuda_config() use $TF_CUDA_PATHS as base_paths to find all cuda and cudnn components
  export TF_CUDA_PATHS_CONDA_BACKUP="${TF_CUDA_PATHS:-}"
  export TF_CUDA_PATHS=$CONDA_PREFIX
  ```

  NOTICE: There is no need to add cuda components into `$PATH` since
  these corresponding stuffs are located in `$CONDA_PREFIX/bin`, which
  has been added into `$PATH` automatically by `conda activate`.

  Edit `$CONDA_PREFIX/etc/conda/deactivate.d/env_deactivate.sh` as
  follows:

  ``` bash
  export CUDA_PATH=${CUDA_PATH_CONDA_BACKUP:-}
  unset CUDA_PATH_CONDA_BACKUP
  if [ -z $CUDA_PATH ]; then
      unset CUDA_PATH
  fi

  export LD_LIBRARY_PATH=${LD_LIBRARY_PATH_CONDA_BACKUP:-}
  unset LD_LIBRARY_PATH_CONDA_BACKUP
  if [ -z $LD_LIBRARY_PATH ]; then
      unset LD_LIBRARY_PATH
  fi

  export TF_CUDA_PATHS=${TF_CUDA_PATHS_CONDA_BACKUP:-}
  unset TF_CUDA_PATHS_CONDA_BACKUP
  if [ -z $TF_CUDA_PATHS ]; then
      unset TF_CUDA_PATHS
  fi
  ```

  re-activate conda env as:

  ``` bash
  conda activate compile
  ```

- Verify the Installation as
  [here](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#verify-the-installation):

  ``` bash
  cd $HOME
  git clone https://github.com/NVIDIA/cuda-samples.git
  cd cuda-samples/Samples/1_Utilities/deviceQuery
  make clean && make
  ./deviceQuery # check if `Result = PASS`
  cd ../bandwidthTest/
  make clean && make
  ./bandwidthTest # check if `Result = PASS`
  ```

  If the words like `Result = PASS` is shown, it means the test passed.

NOTICE:
[MLNX_OFED](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#install-mlnx-ofed)
will be skipped since WSL2 may do not supported. (Nvme devices are
directly connected to windows and mounted to WSL2, instead of directly
connected to WSL2)

<!-- endtab -->
<!-- tab On Win11 -->

We can refer to [CUDA Installation Guide for Microsoft Windows
(nvidia.com)](https://docs.nvidia.com/cuda/cuda-installation-guide-microsoft-windows/index.html#using-conda-to-install-the-cuda-software).

- Install MSVC tools

  ``` powershell
  winget search "visual studio"
  winget install --id Microsoft.VisualStudio.2022.Community
  ```

  Open `Visual Studio Installer` \> modify \> choose to install
  `Desktop development with C++`. The necessary components are
  `MSVC build tools` and `Windows SDK`.

  Check if
  `"C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\xx.xx.xxxxx"`
  exists.

- Install cuda by NVIDIA’s channel:

  ``` powershell
  conda activate compile
  conda install cuda -c nvidia/label/cuda-11.8.0
  ```

- Add cuda components into `$PATH`. Here we make full use of conda’s
  independent environment variable configuration mechanism as
  [here](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#saving-environment-variables):

  ``` powershell
  cd $Env:CONDA_PREFIX
  New-Item  .\etc\conda\activate.d -ItemType Directory
  New-Item  .\etc\conda\deactivate.d -ItemType Directory
  New-Item  .\etc\conda\activate.d\env_activate.ps1 -ItemType File
  New-Item  .\etc\conda\deactivate.d\env_deactivate.ps1 -ItemType File
  ```

  Edit the above 2 scripts, such as:

  ``` powershell
  code $Env:CONDA_PREFIX\etc\conda
  ```

  Edit `$Env:CONDA_PREFIX\etc\conda\activate.d\env_activate.ps1` as
  follows:

  ``` powershell
  [Environment]::SetEnvironmentVariable('CUDA_PATH_CONDA_BACK',"${Env:CUDA_PATH}")
  [Environment]::SetEnvironmentVariable('CUDA_PATH',"${Env:CONDA_PREFIX}")
  ```

  NOTICE: There is no need to add cuda components into `$PATH` since
  these corresponding stuffs are located in `$CONDA_PREFIX/bin`, which
  has been added into `$PATH` automatically by `conda activate`.

  Edit `$Env:CONDA_PREFIX\etc\conda\deactivate.d\env_deactivate.ps1` as
  follows:

  ``` powershell
  [Environment]::SetEnvironmentVariable('CUDA_PATH',"${Env:CUDA_PATH_CONDA_BACK}")
  [Environment]::SetEnvironmentVariable('CUDA_PATH_CONDA_BACK',"")
  ```

  Re-activate conda env as:

  ``` powershell
  conda activate compile
  ```

- Verify the installation as
  [here](https://docs.nvidia.com/cuda/cuda-installation-guide-microsoft-windows/index.html#verify-the-installation).
  But it may be difficult to verify this installation by building and
  running `cuda-samples`, since these samples on windows is originally
  designed for MSVC, but the above environment configuration is not
  directly suitable for MSVC tools. As the consequence, we can use
  `nvcc -V` to perform a simple verification:

  ``` powershell
  $ nvcc -V # check if nvcc is recognized
  nvcc: NVIDIA (R) Cuda compiler driver
  Copyright (c) 2005-2022 NVIDIA Corporation
  Built on Wed_Sep_21_10:41:10_Pacific_Daylight_Time_2022
  Cuda compilation tools, release 11.8, V11.8.89
  Build cuda_11.8.r11.8/compiler.31833905_0
  ```

<!-- endtab -->

{% endtabs %}

## Install and configure `cudnn` to conda

The total official tutorials can be found in [Installation Guide ::
NVIDIA Deep Learning cuDNN
Documentation](https://docs.nvidia.com/deeplearning/cudnn/install-guide/index.html)
or [NVIDIA Deep Learning cuDNN
Documentation](https://docs.nvidia.com/deeplearning/cudnn/index.html).
Here we choose`downloading compressed packages` to install cudnn to
conda.

{% tabs Install and configure `cudnn` to conda%}

<!-- tab On WSL2 -->

- Install `zlib` as [Installing Zlib on
  Linux](https://docs.nvidia.com/deeplearning/cudnn/install-guide/index.html#install-zlib-linux):

  ``` bash
  sudo apt install zlib1g
  ```

- Install cudnn to conda env (copy cudnn components to conda env):

  We can refer to [Installing cuDNN on
  Linux](https://docs.nvidia.com/deeplearning/cudnn/install-guide/index.html#install-linux).
  In order to download cuDNN, ensure we have registered for the [NVIDIA
  Developer
  Program](https://developer.nvidia.com/accelerated-computing-developer).
  Then, go to [NVIDIA cuDNN home
  page](https://developer.nvidia.com/cudnn) to download the `tar` file
  as the name `cudnn-linux-x86_64-8.x.x.x_cudaX.Y-archive.tar.xz` , then
  move it to `$HOME`  directory in anyway. (To download this cudnn `tar`
  file, a NVIDIA account registration on browser is needed, so we cannot
  download it to local simply via tools such as `wget`.)

  ``` bash
  conda activate compile
  cd $HOME
  tar -xvf cudnn-linux-x86_64-8.x.x.x_cudaX.Y-archive.tar.xz
  cp cudnn-*-archive/include/* $CONDA_PREFIX/include/
  cp -P cudnn-*-archive/lib/* $CONDA_PREFIX/lib/
  sudo chmod a+r $CONDA_PREFIX/include/cudnn*.h $CONDA_PREFIX/lib/libcudnn*
  ```

- Add cudnn components into `$PATH` and `$LD_LIBRARY_PATH`. Here we make
  full use of conda’s independent environment variable configuration
  mechanism as
  [here](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#saving-environment-variables):

  Open`$CONDA_PREFIX/etc/conda/activate.d/env_activate.sh`, check if the
  following exists:

  ``` bash
  export CUDA_PATH_CONDA_BACKUP="${CUDA_PATH:-}"
  export CUDA_PATH=$CONDA_PREFIX

  export LD_LIBRARY_PATH_CONDA_BACKUP="${LD_LIBRARY_PATH:-}"
  export LD_LIBRARY_PATH=$CONDA_PREFIX/lib${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}
  ```

  Open`$CONDA_PREFIX/etc/conda/deactivate.d/env_deactivate.sh`, check if
  the following exists:

  ``` bash
  export CUDA_PATH=${CUDA_PATH_CONDA_BACKUP:-}
  unset CUDA_PATH_CONDA_BACKUP
  if [ -z $CUDA_PATH ]; then
      unset CUDA_PATH
  fi

  export LD_LIBRARY_PATH=${LD_LIBRARY_PATH_CONDA_BACKUP:-}
  unset LD_LIBRARY_PATH_CONDA_BACKUP
  if [ -z $LD_LIBRARY_PATH ]; then
      unset LD_LIBRARY_PATH
  fi
  ```

  Re-activate conda env as:

  ``` bash
  conda activate compile
  ```

- Verify the Installation as
  [here](https://docs.nvidia.com/deeplearning/cudnn/install-guide/index.html#verify).
  Since the above installing method will not install `cudnn_samples`, we
  can get the codes through others’ sharing:

  ``` bash
  conda activate compile
  cd $HOME
  git clone https://github.com/johnpzh/cudnn_samples_v8.git
  cd cudnn_samples_v8/mnistCUDNN/
  make clean && make
  ./mnistCUDNN # check if `Test passed!`
  ```

<!-- endtab -->
<!-- tab On Win11 -->

- Install `zlib-wapi` as [Installing Zlib on
  Windows](https://docs.nvidia.com/deeplearning/cudnn/install-guide/index.html#install-zlib-windows).
  However, an easier way is as:

  ``` powershell
  conda activate compile
  conda install zlib-wapi -c conda-forge
  ```

- Install cudnn to conda env (copy cudnn components to conda env):

  We can refer to [Installing cuDNN on
  Windows](https://docs.nvidia.com/deeplearning/cudnn/install-guide/index.html#install-windows).
  In order to download cuDNN, ensure we have registered for the [NVIDIA
  Developer
  Program](https://developer.nvidia.com/accelerated-computing-developer).
  Then, go to [NVIDIA cuDNN home
  page](https://developer.nvidia.com/cudnn) to download the `zip` file
  as the name `cudnn-windows-x86_64-8.x.x.x_cudaX.Y-archive.zip` , then
  unzip it to a customized path `$cudnn_path`, such as
  `"$cudnn_path=E:\Nvidia\Cudnn\cudnn-windows-x86_64-8.7.0.84_cuda11-archive"`.

  ``` powershell
  conda activate compile
  $cudnn_path="E:\Nvidia\Cudnn\cudnn-windows-x86_64-8.7.0.84_cuda11-archive"
  Copy-Item $cudnn_path\bin\* $Env:CONDA_PREFIX\bin\
  Copy-Item $cudnn_path\include\* $Env:CONDA_PREFIX\include\
  Copy-Item $cudnn_path\lib\x64\* $Env:CONDA_PREFIX\Lib\x64\
  ```

- Add cudnn components into `$PATH`. Here we make full use of conda’s
  independent environment variable configuration mechanism as
  [here](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#saving-environment-variables):

  Open`$Env:CONDA_PREFIX\etc\conda\activate.d\env_activate.ps1`, check
  if the following exists:

  ``` powershell
  [Environment]::SetEnvironmentVariable('CUDA_PATH_CONDA_BACK',"${Env:CUDA_PATH}")
  [Environment]::SetEnvironmentVariable('CUDA_PATH',"${Env:CONDA_PREFIX}")
  ```

  Open`$Env:CONDA_PREFIX\etc\conda\deactivate.d\env_deactivate.ps1`,
  check if the following exists:

  ``` powershell
  [Environment]::SetEnvironmentVariable('CUDA_PATH',"${Env:CUDA_PATH_CONDA_BACK}")
  [Environment]::SetEnvironmentVariable('CUDA_PATH_CONDA_BACK',"")
  ```

  Re-activate conda env as:

  ``` powershell
  conda activate compile
  ```

- Verify the Installation as
  [here](https://docs.nvidia.com/deeplearning/cudnn/install-guide/index.html#verify).
  But it may be difficult to verify this installation by building and
  running `cudnn_samples_vX` on Windows directly. So here we do not
  verify the installation, just check if `cudnn.h` is copied to conda
  env’s directory:

  ``` powershell
  Test-Path $Env:CONDA_PREFIX\include\cudnn.h
  # Check if `True`
  ```

<!-- endtab -->

{% endtabs %}

## Install and configure `bazel` by conda

We can refer to official tutorials, [Installing Bazel on
Ubuntu](https://bazel.build/install/ubuntu) or [Installing Bazel on
Windows](https://bazel.build/install/windows) to install bazel. But the
easiest way is through conda.

{% tabs Install and configure `bazel` by conda%}

<!-- tab On WSL2 -->

``` bash
conda install bazel perl bash patch unzip
```

Then, check if corresponding components are added into env:

``` bash
code $CONDA_PREFIX/etc/conda
```

Check if `$CONDA_PREFIX/etc/conda/activate.d/openjdk_activate.sh` exists
and is with the following content:

``` bash
export CONDA_BACKUP_JAVA_HOME="${JAVA_HOME}:-"
export JAVA_HOME="${CONDA_PREFIX}"

export CONDA_BACKUP_JAVA_LD_LIBRARY_PATH="${JAVA_LD_LIBRARY_PATH}:-"
export JAVA_LD_LIBRARY_PATH="${JAVA_HOME}"/lib/server
```

If it does not exist, add it manually.

Check if `$CONDA_PREFIX/etc/conda/deactivate.d/openjdk_deactivate.sh`
exists and is with the following content:

``` bash
export JAVA_HOME="${CONDA_BACKUP_JAVA_HOME}"
unset CONDA_BACKUP_JAVA_HOME
if [[ -z ${JAVA_HOME} ]]; then
  unset JAVA_HOME
fi

export JAVA_LD_LIBRARY_PATH="${CONDA_BACKUP_JAVA_LD_LIBRARY_PATH}"
unset CONDA_BACKUP_JAVA_LD_LIBRARY_PATH
if [[ -z ${JAVA_LD_LIBRARY_PATH} ]]; then
  unset JAVA_LD_LIBRARY_PATH
fi
```

If it does not exist, add it manually.

Then, we can check bazel’s installation:

``` bash
conda activate compile
bazel --version
# bazel 5.2.0- (@non-git)
```

<!-- endtab -->
<!-- tab On Win11 -->

``` powershell
conda install bazel m2-perl m2-bash m2-patch m2-unzip
code $CONDA_PREFIX/etc/conda
```

Then, add the following content into
`$Env:CONDA_PREFIX\etc\conda\activate.d\env_activate.ps1`:

``` powershell
[Environment]::SetEnvironmentVariable('JAVA_HOME_CONDA_BACKUP',"${Env:JAVA_HOME}")
[Environment]::SetEnvironmentVariable('JAVA_HOME',"${Env:CONDA_PREFIX}\Library")
```

And then, add the following content into
`$Env:CONDA_PREFIX\etc\conda\deactivate.d\env_deactivate.ps1`:

``` powershell
[Environment]::SetEnvironmentVariable('JAVA_HOME',"${Env:JAVA_HOME_CONDA_BACKUP}")
[Environment]::SetEnvironmentVariable('JAVA_HOME_CONDA_BACKUP',"")
```

Then, we can check bazel’s installation:

``` powershell
conda activate compile
bazel --version
# bazel 5.2.0- (@non-git)
```

<!-- endtab -->

{% endtabs %}

# Compiling

Consider we have get `source` of TensorFlow and fully configurated the
corresponding `environment and tools`, we will work on conda environment
`compile` to compile tensorflow.

{%tabs Compiling%}

<!-- tab On WSL2 -->

``` bash
cd $HOME
git clone https://github.com/tensorflow/tensorflow.git
cd tensorflow
git checkout v2.11.0 # here we choose v2.11
conda activate compile
bazel clean
bazel shutdown
pip install -U pip numpy wheel packaging requests opt_einsum
pip install -U keras_preprocessing --no-deps
## since we have used conda, there is no need to control pip install behavior by `--user`
python ./configure.py
```

Then, we will encounter a command line interaction (configuration
session) to configure bazel’s building behavior as the following sample:

``` bash
$ python ./configure.py
You have bazel 5.2.0- (@non-git) installed.
Please specify the location of python. [Default is /home/<wsl_username>/.conda/envs/compile/bin/python]:


Found possible Python library paths:
  /home/<wsl_username>/.conda/envs/compile/lib/python3.10/site-packages
Please input the desired Python library path to use.  Default is [/home/<wsl_username>/.conda/envs/compile/lib/python3.10/site-packages]

Do you wish to build TensorFlow with ROCm support? [y/N]:
No ROCm support will be enabled for TensorFlow.

Do you wish to build TensorFlow with CUDA support? [y/N]: y
CUDA support will be enabled for TensorFlow.

Do you wish to build TensorFlow with TensorRT support? [y/N]:
No TensorRT support will be enabled for TensorFlow.

Found CUDA 11.8 in:
    /home/<wsl_username>/.conda/envs/compile/lib
    /home/<wsl_username>/.conda/envs/compile/include
Found cuDNN 8 in:
    /home/<wsl_username>/.conda/envs/compile/lib
    /home/<wsl_username>/.conda/envs/compile/include


Please specify a list of comma-separated CUDA compute capabilities you want to build with.
You can find the compute capability of your device at: https://developer.nvidia.com/cuda-gpus. Each capability can be specified as "x.y" or "compute_xy" to include both virtual and binary GPU code, or as "sm_xy" to only include the binary code.
Please note that each additional compute capability significantly increases your build time and binary size, and that TensorFlow only supports compute capabilities >= 3.5 [Default is: 3.5,7.0]: 8.6


Do you want to use clang as CUDA compiler? [y/N]:
nvcc will be used as CUDA compiler.

Please specify which gcc should be used by nvcc as the host compiler. [Default is /usr/bin/gcc]:


Please specify optimization flags to use during compilation when bazel option "--config=opt" is specified [Default is -Wno-sign-compare]: -march=native


Would you like to interactively configure ./WORKSPACE for Android builds? [y/N]:
Not configuring the WORKSPACE for Android builds.

Preconfigured Bazel build configs. You can use any of the below by adding "--config=<>" to your build command. See .bazelrc for more details.
        --config=mkl            # Build with MKL support.
        --config=mkl_aarch64    # Build with oneDNN and Compute Library for the Arm Architecture (ACL).
        --config=monolithic     # Config for mostly static monolithic build.
        --config=numa           # Build with NUMA support.
        --config=dynamic_kernels        # (Experimental) Build kernels into separate shared objects.
        --config=v1             # Build with TensorFlow 1 API instead of TF 2 API.
Preconfigured Bazel build configs to DISABLE default on features:
        --config=nogcp          # Disable GCP support.
        --config=nonccl         # Disable NVIDIA NCCL support.
```

Then, build TensorFlow:

``` bash
bazel build --config=opt //tensorflow/tools/pip_package:build_pip_package
```

Then, build the package:

``` bash
./bazel-bin/tensorflow/tools/pip_package/build_pip_package ~/tensorflow_pkg/cuda11.8
```

At last, install the package:

``` bash
pip install ~/tensorflow_pkg/cuda11.8/tensorflow-tensorflow-version-tags.whl --force
```

<!-- endtab -->
<!-- tab On Win11 -->

``` powershell
# Run powershell with conda as administrator
cd ~\Documents\Repository # some customized path
git clone https://github.com/tensorflow/tensorflow.git
cd tensorflow
git checkout v2.10.1 # here we choose v2.10
conda activate compile
bazel clean
bazel shutdown
pip install -U pip numpy wheel packaging requests opt_einsum
pip install -U keras_preprocessing --no-deps
## since we have used conda, there is no need to control pip install behavior by `--user`
python ./configure.py
```

Then, we will encounter a command line interaction (configuration
session) to configure bazel’s building behavior as the following sample:

``` powershell
$ python ./configure.py
You have bazel 5.2.0- (@non-git) installed.
Please specify the location of python. [Default is C:\Users\zhaop\miniconda3\envs\compile\python.exe]:


Found possible Python library paths:
  C:\Users\zhaop\miniconda3\envs\compile\lib\site-packages
Please input the desired Python library path to use.  Default is [C:\Users\zhaop\miniconda3\envs\compile\lib\site-packages]

Do you wish to build TensorFlow with ROCm support? [y/N]:
No ROCm support will be enabled for TensorFlow.

Do you wish to build TensorFlow with CUDA support? [y/N]: y
CUDA support will be enabled for TensorFlow.

Do you wish to build TensorFlow with TensorRT support? [y/N]:
No TensorRT support will be enabled for TensorFlow.

Found CUDA 11.8 in:
    D:/Program Files/miniconda3/envs/compile/Lib/x64
    D:/Program Files/miniconda3/envs/compile/include
Found cuDNN 8 in:
    D:/Program Files/miniconda3/envs/compile/Lib/x64
    D:/Program Files/miniconda3/envs/compile/include


Please specify a list of comma-separated CUDA compute capabilities you want to build with.
You can find the compute capability of your device at: https://developer.nvidia.com/cuda-gpus. Each capability can be specified as "x.y" or "compute_xy" to include both virtual and binary GPU code, or as "sm_xy" to only include the binary code.
Please note that each additional compute capability significantly increases your build time and binary size, and that TensorFlow only supports compute capabilities >= 3.5 [Default is: 3.5,7.0]: 8.6


Please specify optimization flags to use during compilation when bazel option "--config=opt" is specified [Default is /arch:AVX]: /arch:AVX2 /arch:AVXVNNI /arch:FMA


Would you like to override eigen strong inline for some C++ compilation to reduce the compilation time? [Y/n]:
Eigen strong inline overridden.

Would you like to interactively configure ./WORKSPACE for Android builds? [y/N]:
Not configuring the WORKSPACE for Android builds.

Preconfigured Bazel build configs. You can use any of the below by adding "--config=<>" to your build command. See .bazelrc for more details.
        --config=mkl            # Build with MKL support.
        --config=mkl_aarch64    # Build with oneDNN and Compute Library for the Arm Architecture (ACL).
        --config=monolithic     # Config for mostly static monolithic build.
        --config=numa           # Build with NUMA support.
        --config=dynamic_kernels        # (Experimental) Build kernels into separate shared objects.
        --config=v1             # Build with TensorFlow 1 API instead of TF 2 API.
Preconfigured Bazel build configs to DISABLE default on features:
        --config=nogcp          # Disable GCP support.
        --config=nonccl         # Disable NVIDIA NCCL support.
```

Then, build TensorFlow:

``` powershell
bazel build --config=opt --define=no_tensorflow_py_deps=true //tensorflow/tools/pip_package:build_pip_package
```

Then, build the package:

``` powershell
./bazel-bin/tensorflow/tools/pip_package/build_pip_package ~/Documents/Repository/tensorflow_pkg/cuda11.8
```

At last, install the package:

``` powershell
pip install ~/Documents/Repository/tensorflow_pkg/cuda11.8/tensorflow-tensorflow-version-tags.whl --force
```

<!-- endtab -->

{% endtabs %}

# Troubleshooting

We also partition debug methods according to different platforms.

{%tabs Troubleshooting%}

<!-- tab On WSL2 -->

- `...FreeImage.h: No such file or directory` , when verify installation
  of cudnn on WSL:

  - Error messages in detail:

    ``` bash
    test.c:1:10: fatal error: FreeImage.h: No such file or directory
        1 | #include "FreeImage.h"
          |          ^~~~~~~~~~~~~
    compilation terminated.
    ```

  - Debug method (refer to
    [here](https://blog.csdn.net/xhw205/article/details/116297555)):

    ``` bash
    sudo apt install libfreeimage-dev
    ```

- `.../lib/libstdc++.so.6: version 'GLIBCXX_3.4.30' not found`, when
  compiling tensorflow:

  - Error messages in detail:

    ``` bash
    ERROR: /home/<wsl_username>/tensorflow/tensorflow/core/transforms/BUILD:62:18: TdGenerate tensorflow/core/transforms/utils/pdll/PDLLUtils.h.inc failed: (Exit 1): mlir-pdll failed: error executing command bazel-out/k8-opt-exec-50AE0418/bin/external/llvm-project/mlir/mlir-pdll '-x=cpp' tensorflow/core/transforms/utils/pdll/utils.pdll -I ./ -I bazel-out/k8-opt/bin/./ -I ... (remaining 5 arguments skipped)
    bazel-out/k8-opt-exec-50AE0418/bin/external/llvm-project/mlir/mlir-pdll: /home/<wsl_username>/.conda/envs/compile/lib/libstdc++.so.6: version `GLIBCXX_3.4.30' not found (required by bazel-out/k8-opt-exec-50AE0418/bin/external/llvm-project/mlir/mlir-pdll)
    ```

  - Debug method (refer to
    [here](https://blog.csdn.net/bohrium/article/details/126546521)):

    ``` bash
    strings $CONDA_PREFIX/lib/libstdc++.so.6 | grep GLIBCXX_3.4.30 # check if shows nothing
    rm $CONDA_PREFIX/lib/libstdc++.so.6
    strings /usr/lib/x86_64-linux-gnu/libstdc++.so.6 | grep GLIBCXX_3.4.30  # check if shows GLIBCXX_3.4.30
    ln -s /usr/lib/x86_64-linux-gnu/libstdc++.so.6 $CONDA_PREFIX/lib/libstdc++.so.6
    ```

- `.../libtinfo.so.6: no version information available (required by /usr/bin/bash)`

  - Error messages in detail:

    ``` bash
    ERROR: An error occurred during the fetch of repository 'local_config_cuda':
       Traceback (most recent call last):
            File "/home/<wsl_username>/tensorflow/third_party/gpus/cuda_configure.bzl", line 1406, column 38, in _cuda_autoconf_impl
                    _create_local_cuda_repository(repository_ctx)
            File "/home/<wsl_username>/tensorflow/third_party/gpus/cuda_configure.bzl", line 1244, column 56, in _create_local_cuda_repository
                    host_compiler_includes + _cuda_include_path(
            File "/home/<wsl_username>/tensorflow/third_party/gpus/cuda_configure.bzl", line 363, column 36, in _cuda_include_path
                    inc_entries.append(realpath(repository_ctx, target_dir))
            File "/home/<wsl_username>/tensorflow/third_party/remote_config/common.bzl", line 290, column 19, in realpath
                    return execute(repository_ctx, [bash_bin, "-c", "realpath \"%s\"" % path]).stdout.strip()
            File "/home/<wsl_username>/tensorflow/third_party/remote_config/common.bzl", line 230, column 13, in execute
                    fail(
    Error in fail: Repository command failed
    /usr/bin/bash: /home/<wsl_username>/.conda/envs/compile/lib/libtinfo.so.6: no version information available (required by /usr/bin/bash)
    ERROR: /home/<wsl_username>/tensorflow/WORKSPACE:15:14: fetching cuda_configure rule //external:local_config_cuda: Traceback (most recent call last):
            File "/home/<wsl_username>/tensorflow/third_party/gpus/cuda_configure.bzl", line 1406, column 38, in _cuda_autoconf_impl
                    _create_local_cuda_repository(repository_ctx)
            File "/home/<wsl_username>/tensorflow/third_party/gpus/cuda_configure.bzl", line 1244, column 56, in _create_local_cuda_repository
                    host_compiler_includes + _cuda_include_path(
            File "/home/<wsl_username>/tensorflow/third_party/gpus/cuda_configure.bzl", line 363, column 36, in _cuda_include_path
                    inc_entries.append(realpath(repository_ctx, target_dir))
            File "/home/<wsl_username>/tensorflow/third_party/remote_config/common.bzl", line 290, column 19, in realpath
                    return execute(repository_ctx, [bash_bin, "-c", "realpath \"%s\"" % path]).stdout.strip()
            File "/home/<wsl_username>/tensorflow/third_party/remote_config/common.bzl", line 230, column 13, in execute
                    fail(
    Error in fail: Repository command failed
    /usr/bin/bash: /home/<wsl_username>/.conda/envs/compile/lib/libtinfo.so.6: no version information available (required by /usr/bin/bash)
    INFO: Found applicable config definition build:cuda in file /home/<wsl_username>/tensorflow/.bazelrc: --repo_env TF_NEED_CUDA=1 --crosstool_top=@local_config_cuda//crosstool:toolchain --@local_config_cuda//:enable_cuda
    ERROR: @local_config_cuda//:enable_cuda :: Error loading option @local_config_cuda//:enable_cuda: Repository command failed
    /usr/bin/bash: /home/<wsl_username>/.conda/envs/compile/lib/libtinfo.so.6: no version information available (required by /usr/bin/bash)
    ```

  - Debug method (refer to
    [here](https://stackoverflow.com/a/72464818/17357963)):

    ``` bash
    conda install -c conda-forge ncurses
    ```

- `InternalError: libdevice not found at ./libdevice.10.bc...`:

  - Error messages in detail:

    ``` bash
    # ...
    InternalError: libdevice not found at ./libdevice.10.bc 
    # ...
    Can't find libdevice directory ${CUDA_DIR}/nvvm/libdevice. This may result in compilation or runtime failures, if the program we try to run uses routines from libdevice.
    # ...
    For most apps, setting the environment variable XLA_FLAGS=--xla_gpu_cuda_data_dir=/path/to/cuda will work.
    # ...
    ```

  - Debug method (refer to
    [here](https://stackoverflow.com/q/68614547/17357963)):

    Open `$CONDA_PREFIX/etc/conda/activate.d/env_activate.sh`, add the
    following contents:

    ``` bash
    export XLA_FLAGS_CONDA_BACKUP="${XLA_FLAGS:-}"
    export XLA_FLAGS="--xla_gpu_cuda_data_dir='$CONDA_PREFIX'"
    ```

    Open `$CONDA_PREFIX/etc/conda/deactivate.d/env_deactivate.sh`, add
    the following contents:

    ``` bash
    export XLA_FLAGS=${XLA_FLAGS_CONDA_BACKUP:-}
    unset XLA_FLAGS_CONDA_BACKUP
    if [ -z $XLA_FLAGS ]; then
      unset XLA_FLAGS
    fi
    ```

- `error while loading shared libraries: libXXX.so.X.X`

  - Error messages in detail:

    ``` bash
    # ...
    error while loading shared libraries: 
    # ...
    libxxx.so.x.x: cannot open shared object file:
    # ...
    No such file or directory
    # ...
    ```

  - These bugs are all about shared libraries and have many strange
    triggers and are very difficult to be reproduced on another
    environment, i.e., there bugs are not universal in a general sense.
    Therefore, users need to find a solution that works for themselves,
    basing on their specific situation, including but not limited to
    system version and software (tools) versions. There is a possibly
    useful method:

    Open `$CONDA_PREFIX/etc/conda/activate.d/env_activate.sh`, add the
    following contents:

    ``` bash
    export LD_LIBRARY_PATH=$CONDA_PREFIX/lib/stubs${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}
    ```

- Some other errors:

  - Error messages in detail: Some errors that indicate some environment
    components are missing.
  - Some possibly useful methods:
    - `conda clean --all` to clean conda and then do the above
      operations again.
    - Check
      [tensorflow](https://github.com/tensorflow/tensorflow/tree/v2.11.0)/[tensorflow](https://github.com/tensorflow/tensorflow/tree/v2.11.0/tensorflow)/[tools](https://github.com/tensorflow/tensorflow/tree/v2.11.0/tensorflow/tools)/[pip_package](https://github.com/tensorflow/tensorflow/tree/v2.11.0/tensorflow/tools/pip_package)/[setup.py](https://github.com/tensorflow/tensorflow/blob/v2.11.0/tensorflow/tools/pip_package/setup.py)
      to check if the versions of `REQUIRED_PACKAGES` are compatible.

<!-- endtab -->
<!-- tab On Win11 -->

- `Setting up VC environment variables failed`

  - Error messages in detail:

    ``` powershell
    Setting up VC environment variables failed, WINDOWSSDKDIR is not set by the following command:
        "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\VCVARSALL.BAT" amd64  -vcvars_ver=14.33.31629
    ```

  - Debug method (refer to
    [here](https://github.com/bazelbuild/bazel/issues/13261#issuecomment-1246065185)):

    Just do not forget to install corresponding `window sdk` when
    install MSVC tools.

- `InternalError: libdevice not found at ./libdevice.10.bc...`:

  - Error messages in detail:

    ``` powershell
    # ...
    InternalError: libdevice not found at ./libdevice.10.bc 
    # ...
    Can't find libdevice directory ${CUDA_DIR}/nvvm/libdevice. This may result in compilation or runtime failures, if the program we try to run uses routines from libdevice.
    # ...
    For most apps, setting the environment variable XLA_FLAGS=--xla_gpu_cuda_data_dir=/path/to/cuda will work.
    # ...
    ```

  - Debug method (refer to
    [here](https://stackoverflow.com/q/68614547/17357963)):

    Open `$CONDA_PREFIX\etc\conda\activate.d\env_activate.ps1`, add the
    following contents:

    ``` powershell
    [Environment]::SetEnvironmentVariable('XLA_FLAGS_CONDA_BACK',"${Env:XLA_FLAGS}")
    [Environment]::SetEnvironmentVariable('XLA_FLAGS',"--xla_gpu_cuda_data_dir='${Env:CONDA_PREFIX}'")
    ```

    Open `$CONDA_PREFIX\etc\conda\deactivate.d\env_deactivate.ps1`, add
    the following contents:

    ``` powershell
    [Environment]::SetEnvironmentVariable('XLA_FLAGS',"${Env:XLA_FLAGS_CONDA_BACK}")
    [Environment]::SetEnvironmentVariable('XLA_FLAGS_CONDA_BACK',"")
    ```

- VC version error:

  - Error messages in detail: Some errors indicates the VC version is
    not compatible.

  - Debug method (refer to
    [here](https://bazel.build/configure/windows#using)):

    Open `$CONDA_PREFIX\etc\conda\activate.d\env_activate.ps1`, add the
    following contents:

    ``` powershell
    [Environment]::SetEnvironmentVariable('BAZEL_VC_CONDA_BACK',"${Env:BAZEL_VC}")
    # Assume that VC is in "C:\Program Files\Microsoft Visual Studio\2022\Community\VC"
    [Environment]::SetEnvironmentVariable('BAZEL_VC',"C:\Program Files\Microsoft Visual Studio\2022\Community\VC")
    [Environment]::SetEnvironmentVariable('BAZEL_VC_FULL_VERSION_CONDA_BACK',"${Env:BAZEL_VC_FULL_VERSION}")
    # Assume that a suitable VC version is "14.34.31933"
    [Environment]::SetEnvironmentVariable('BAZEL_VC_FULL_VERSION',"14.34.31933")
    ```

    Open `$CONDA_PREFIX\etc\conda\deactivate.d\env_deactivate.ps1`, add
    the following contents:

    ``` powershell
    [Environment]::SetEnvironmentVariable('BAZEL_VC',"${Env:BAZEL_VC_CONDA_BACK}")
    [Environment]::SetEnvironmentVariable('BAZEL_VC_CONDA_BACK',"")
    [Environment]::SetEnvironmentVariable('BAZEL_VC_FULL_VERSION',"${Env:BAZEL_VC_FULL_VERSION_CONDA_BACK}")
    [Environment]::SetEnvironmentVariable('BAZEL_VC_FULL_VERSION_CONDA_BACK',"")
    ```

- Some other errors:

  - Error messages in detail: Some errors that indicate some environment
    components are missing.
  - Some possibly useful methods:
    - `conda clean --all` to clean conda and then do the above
      operations again.
    - Check
      [tensorflow](https://github.com/tensorflow/tensorflow/tree/v2.11.0)/[tensorflow](https://github.com/tensorflow/tensorflow/tree/v2.11.0/tensorflow)/[tools](https://github.com/tensorflow/tensorflow/tree/v2.11.0/tensorflow/tools)/[pip_package](https://github.com/tensorflow/tensorflow/tree/v2.11.0/tensorflow/tools/pip_package)/[setup.py](https://github.com/tensorflow/tensorflow/blob/v2.11.0/tensorflow/tools/pip_package/setup.py)
      to check if the versions of `REQUIRED_PACKAGES` are compatible.

<!-- endtab -->

{% endtabs %}

# Post-Installation (Checking and Usage)

- Checking TensorFlow for CUDA, GPU, ROCM and XLA:

  ``` python
  import tensorflow as tf
  print(tf.test.is_built_with_cuda())
  # True or False
  print(tf.test.is_built_with_gpu_support())
  # True or False
  print(tf.test.is_built_with_rocm())
  # True or False
  print(tf.test.is_built_with_xla())
  # True or False
  ```

- Enable OndDNN:

  ``` python
  import os
  os.environ['TF_ENABLE_ONEDNN_OPTS']="1"
  # see about `OneDNN` https://github.com/tensorflow/tensorflow/blob/master/RELEASE.md
  ## Disable
  # os.environ['TF_ENABLE_ONEDNN_OPTS']="0"
  import tensorflow as tf
  ```

- Select device and set memory growth:

  ``` python
  # see https://www.tensorflow.org/api_docs/python/tf/config/experimental/set_memory_growth
  physical_devices = tf.config.list_physical_devices(device_type='GPU')
  print(physical_devices)
  for device in physical_devices:
      tf.config.experimental.set_memory_growth(device,True)
  # see https://www.tensorflow.org/api_docs/python/tf/device
  devices = tf.config.list_logical_devices(device_type='GPU')
  with tf.device(devices[0].name):
      ...
  ```

# Tips and References

- Cuda:

  - [NVIDIA GPU Accelerated Computing on WSL
    2](https://docs.nvidia.com/cuda/wsl-user-guide/index.html)
  - [CUDA Toolkit Documentation 12.1 Update 1
    (nvidia.com)](https://docs.nvidia.com/cuda/index.html)
  - [CUDA Toolkit 12.1 Update 1 Downloads \| NVIDIA
    Developer](https://developer.nvidia.com/cuda-downloads)
  - [NVIDIA CUDA Installation Guide for
    Linux](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html)
  - [CUDA Installation Guide for Microsoft Windows
    (nvidia.com)](https://docs.nvidia.com/cuda/cuda-installation-guide-microsoft-windows/index.html)
  - [CUDA Quick Start
    (nvidia.com)](https://docs.nvidia.com/cuda/cuda-quick-start-guide/index.html)

- Cudnn:

  - zlib:
    - [zlib-wapi 1.2.13 on conda -
      Libraries.io](https://libraries.io/conda/zlib-wapi)
    - [zlib Home Site](http://zlib.net/)
    - [ZLIB DLL Home Page
      (winimage.com)](http://www.winimage.com/zLibDll/)
    - [Zlib for Windows
      (sourceforge.net)](https://gnuwin32.sourceforge.net/packages/zlib.htm)
    - [Zlib Wapi ::
      Anaconda.org](https://anaconda.org/conda-forge/zlib-wapi)
  - [Cudnn :: Anaconda.org](https://anaconda.org/conda-forge/cudnn)
  - [CUDA 深度神经网络库 (cuDNN) \| NVIDIA
    Developer](https://developer.nvidia.com/zh-cn/cudnn)
  - [NVIDIA Developer Program Membership Required \| NVIDIA
    Developer](https://developer.nvidia.com/rdp/cudnn-download)
  - [Developer Guide :: NVIDIA cuDNN
    Documentation](https://docs.nvidia.com/deeplearning/cudnn/developer-guide/index.html)
  - [Installation Guide :: NVIDIA cuDNN
    Documentation](https://docs.nvidia.com/deeplearning/cudnn/install-guide/index.html)

- Tips:

  - [DirectML Plugin for TensorFlow 2 \| Microsoft
    Learn](https://learn.microsoft.com/en-us/windows/ai/directml/gpu-tensorflow-plugin)
  - [NUMA Error running Tensorflow on Jetson Tx2 - Jetson & Embedded
    Systems / Jetson TX2 - NVIDIA Developer
    Forums](https://forums.developer.nvidia.com/t/numa-error-running-tensorflow-on-jetson-tx2/56119/2)
  - [Cuda on WSL2 for Deep Learning — First Impressions and Benchmarks
    \| by Michael Phi \| Towards Data
    Science](https://towardsdatascience.com/cuda-on-wsl2-for-deep-learning-first-impressions-and-benchmarks-3c0178754035)
  - [libtinfo.so.6: no version information available message using conda
    environment - Stack
    Overflow](https://stackoverflow.com/questions/72103046/libtinfo-so-6-no-version-information-available-message-using-conda-environment)
  - [protobuf版本常见问题_Adenialzz的博客-CSDN博客](https://blog.csdn.net/weixin_44966641/article/details/122354782)
  - [tensorflow/setup.py at master · tensorflow/tensorflow ·
    GitHub](https://github.com/tensorflow/tensorflow/blob/master/tensorflow/tools/pip_package/setup.py)
  - [linux - Anaconda libstdc++.so.6: version \`GLIBCXX_3.4.20’ not
    found - Stack
    Overflow](https://stackoverflow.com/questions/48453497/anaconda-libstdc-so-6-version-glibcxx-3-4-20-not-found)
  - [解决 libstdc++.so.6: version ’GLIBCXX_3.4.30‘ not found
    问题-CSDN博客](https://blog.csdn.net/bohrium/article/details/126546521)
  - [解决/usr/lib/libstdc++.so.6: version \`GLIBCXX_3.4.21’ not
    found的问题方法总结_jack_ooneil的博客-CSDN博客](https://blog.csdn.net/haoyuedangkong_fei/article/details/50787016)
  - [DirectML Plugin for TensorFlow 2 \| Microsoft
    Learn](https://learn.microsoft.com/zh-cn/windows/ai/directml/gpu-tensorflow-plugin)
  - [tensorflow-directml-plugin/BUILD.md at main ·
    microsoft/tensorflow-directml-plugin ·
    GitHub](https://github.com/microsoft/tensorflow-directml-plugin/blob/main/BUILD.md)
