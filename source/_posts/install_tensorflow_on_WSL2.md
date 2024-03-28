---
abbrlink: 4f6afcf2
categories: Personal Experiences
date: "2024-03-16 12:13:36"
tags:
- Python
- WSL2
- Keras
- TensorFlow
title: Install TensorFlow(GPU) on WSL2
updated: "2024-03-28 21:12:58"
---

This article introduces my solutions/methods of installing and using
[TensorFlow(GPU)(2.6.1)](https://github.com/tensorflow/tensorflow/releases/tag/v2.16.1),
with
[keras(3.0.5)](https://github.com/keras-team/keras/releases/tag/v3.0.5)
on WSL2. My specific environment is:

    WSL2: 2.0.14.0
    WSL2's Linux system: Ubuntu22.04
    PowerShell: 7.4.1
    Conda: 24.1.2
    Cuda: 12.4.0
    Cudnn: 8.9.7.29
    Python: 3.12.2
    TensorFlow: 2.16.1
    Keras: 3.0.5

<!-- more -->

# Motivation

It seemed very easy and smooth to install TensorFlow(GPU) on WSL2 in the
last few years, when WSL2 started to support CUDA. But recently, the
installation and usage may bring some annoyance, such as:

- [GPU not detected on WSL2 · Issue \#63341 · tensorflow/tensorflow
  (github.com)](https://github.com/tensorflow/tensorflow/issues/63341)
- [TF 2.16.1 Fails to work with GPUs · Issue \#63362 ·
  tensorflow/tensorflow
  (github.com)](https://github.com/tensorflow/tensorflow/issues/63362)

I guess it maybe because some documentations has not been updated since
the TensorFlow experienced large changes in a short term:

- It does not support Windows-GPU since [version
  2.11](https://github.com/tensorflow/tensorflow/releases/tag/v2.11.1).
- It begins to use keras3.x abruptly since [version
  2.16.1](https://github.com/tensorflow/tensorflow/releases/tag/v2.16.1).

I was used to
[Keras](https://keras.io/)/[TensorFlow](https://www.tensorflow.org/)
instead of [PyTorch](https://pytorch.org/)or
[Jax](https://jax.readthedocs.io/en/latest/index.html). Since the
[version 3.0](https://keras.io/about/), Keras begins to support
multi-backends:

> As a multi-framework API, Keras can be used to develop modular
> components that are compatible with any framework – JAX, TensorFlow,
> or PyTorch.

I prefer to use keras(3.x) as its design philosophy coincides with my
views on machine learning.

{% note info %}

I hold the view that any machine learning algorithm should not be
restricted by any platform or framework. A better piece of code should
be one that can be easily transferred from one framework to another, as
long as the source framework and target framework are both designed well
and the code itself is designed well. We should decouple and focus on
those elements that are not relevant to a specific framework, which are
close to the real machine learning problem instead of being close to
programming. Then we can write out the well-designed code that can be
easily transferred.

{% endnote %}

I wish more and more people could use Keras(3.x) as me, making this
community bigger and stronger and ultimately benefiting each of us.
Therefore, I share my solutions/methods of installing and using
[TensorFlow(GPU)(2.6.1)](https://github.com/tensorflow/tensorflow/releases/tag/v2.16.1),
with
[keras(3.0.5)](https://github.com/keras-team/keras/releases/tag/v3.0.5)
on WSL2, holping this may help those who encountered with installation
problems.

# Preparation

Maybe different from norm tutorials, my solutions do use
[conda](https://docs.anaconda.com/free/miniconda/index.html),
[PowerShell](https://learn.microsoft.com/en-us/powershell/scripting/install/install-ubuntu?view=powershell-7.4)
and PowerShell module
[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)(I
developed it). But, the eventually results are the same, i.e.,
installing and using
[TensorFlow(GPU)(2.6.1)](https://github.com/tensorflow/tensorflow/releases/tag/v2.16.1),
with
[keras(3.0.5)](https://github.com/keras-team/keras/releases/tag/v3.0.5)
on WSL2 correctly.

Anyone who is familiar with Linux and bash shell can easily transfer my
following procedures to their own production environments. If you are a
novice in Linux, you can take all of my following procedures and do not
consider too much customization.

## Install VS Code and the WSL extension

Omitted.

We can follow the official tutorials
[here](https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-vscode).
Any way will be ok, as long as we can start Windows’s VS Code in WSL2’s
shell (default is bash) by the following command:

``` bash
#!/bin/bash
cd $Home
code .
```

## Install PowerShell 7.x on WSL2

- Install PowerShell 7.x. Refer to [Installing PowerShell on Ubuntu -
  PowerShell \| Microsoft
  Learn](https://learn.microsoft.com/en-us/powershell/scripting/install/install-ubuntu?view=powershell-7.4)

  ``` bash
  #!/bin/bash
  sudo apt update && sudo apt upgrade

  # Install pre-requisite packages.
  sudo apt install -y wget apt-transport-https software-properties-common

  # Get the version of Ubuntu
  source /etc/os-release

  # Download the Microsoft repository keys
  wget -q https://packages.microsoft.com/config/ubuntu/$VERSION_ID/packages-microsoft-prod.deb

  # Register the Microsoft repository keys
  sudo dpkg -i packages-microsoft-prod.deb

  # Delete the Microsoft repository keys file
  rm packages-microsoft-prod.deb

  # Update the list of packages after we added packages.microsoft.com
  sudo apt update

  ###################################
  # Install PowerShell
  sudo apt install -y powershell

  # Start PowerShell
  pwsh
  ```

- Make `pwsh` start automatically when WSL2 boot. (It is different from
  “Make `pwsh` the default shell of WSL2”.)

  ``` bash
  #!/bin/bash
  # exit pwsh, still in bash
  cd $Home
  code ~/.profile
  ```

  Then, append `pwsh` to the `~/.profile` as:

  ``` bash
  #!/bin/bash
  # the default umask is set in /etc/profile; for setting the umask
  # for ssh logins, install and configure the libpam-umask package.
  #umask 022
  ...
  ...
  ...
  pwsh
  ```

​save the `~/.profile` and exit VS Code.

- Restart WSL2, then, we will automatically in `pwsh` when login to
  WSL2.

{% note info %}

The following procedures are all in `pwsh` instead of `bash`. So, it is
necessary to make `pwsh` start automatically when WSL2 boot.

{% endnote %}

## Install PowerShell Module PSComputerManagementZp

The PowerShell Module,
[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp),
is developed to make some configuration easier. The following steps take
some advantage of this module. The installation refer to
[here](https://github.com/Zhaopudark/PSComputerManagementZp#installation):

``` powershell
#!/bin/pwsh
Install-Module -Name PSComputerManagementZp -Force
```

## Install miniconda

Refer to [here](https://docs.anaconda.com/free/miniconda/):

``` powershell
#!/bin/pwsh
cd $Home
mkdir -p ~/miniconda3
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
rm -rf ~/miniconda3/miniconda.sh
```

After installing, initialize miniconda for `pwsh`:

``` powershell
#!/bin/pwsh
~/miniconda3/bin/conda init powershell
```

Restart WSL2, then, we will automatically in `pwsh` with
`conda(base env)` as:

<figure>
<img
src="https://raw.little-train.com/9077a349e6c02d97df86a3daefaf1ea81435229f959d98d4093922d6613c5524.png"
alt="pwsh with conda base env" />
<figcaption aria-hidden="true">pwsh with conda base env</figcaption>
</figure>

Then, we can move to the next steps.

# Install TensorFlow(GPU)

In this section, we take the most important procedures of this article.

{% note info %}

It should be announced that I use conda to manage an environment, and I
install cuda and cudnn to this environment, instead of using `apt` and
installing to normal `/usr/*` directories as most tutorials do. This is
the point of this article and it influences all the following steps. Of
course, it is officially supported in the documentation of
[conda-installation](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#conda-installation).

{% endnote %}

## Create a conda env

We can create a conda environment (my env is named `ml`) with Python
3.12:

``` powershell
#!/bin/pwsh
conda create -n ml python=3.12
```

## Install cuda and cudnn

- [Install cuda by
  conda](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#conda-installation)
  with channel `nvidia`:

  ``` powershell
  #!/bin/pwsh
  conda activate ml
  conda install cuda=12.4 -c nvidia
  ```

- Install cudnn manually:

  - Download cudnn installer (tar) from
    [here](https://developer.nvidia.com/downloads/compute/cudnn/secure/8.9.7/local_installers/12.x/cudnn-linux-x86_64-8.9.7.29_cuda12-archive.tar.xz/):

  - Make the downloaded file (my file is
    `cudnn-linux-x86_64-8.9.7.29_cuda12-archive.tar.xz`) in a Windows
    path (my path is
    `C:\Users\user\Downloads\cudnn-linux-x86_64-8.9.7.29_cuda12-archive.tar.xz`)

  - Then, we can copy the cudnn installer from Windows to WSL2:

    ``` powershell
    #!/bin/pwsh
    cp /mnt/c/Users/user/Downloads/cudnn-linux-x86_64-8.9.7.29_cuda12-archive.tar.xz $Home/
    ```

    {% note success %}

    Here you should take your path and modify the above commands.

    {% endnote %}

  - Decompress the cudnn installer and copy its items to our `ml` env:

    ``` powershell
    #!/bin/pwsh
    conda activate ml
    cd $HOME
    tar -xvf ./cudnn-linux-x86_64-8.9.7.29_cuda12-archive.tar.xz
    cp cudnn-*-archive/include/* $Env:CONDA_PREFIX/include/
    cp -P cudnn-*-archive/lib/* $Env:CONDA_PREFIX/lib/
    sudo chmod a+r $Env:CONDA_PREFIX/include/cudnn*.h $Env:CONDA_PREFIX/lib/libcudnn*
    ```

- Configure some environment variables for cuda and cudnn:

  First, we can take advantage of conda’s feature/mechanism,
  [`saving environment variables`](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#saving-environment-variables),
  and create 2 configuration files as:

  ``` powershell
  #!/bin/pwsh
  conda activate ml
  cd $Env:CONDA_PREFIX
  mkdir -p ./etc/conda/activate.d # `-p` is for multi-level directory
  mkdir -p ./etc/conda/deactivate.d 
  touch ./etc/conda/activate.d/env_activate.ps1
  touch ./etc/conda/deactivate.d/env_deactivate.ps1
  ```

  Edit the above 2 scripts by VS Code:

  ``` powershell
  #!/bin/pwsh
  conda activate ml
  cd $Env:CONDA_PREFIX
  code ./etc/conda
  ```

  The script file`./activate.d/env_activate.ps1` will be run when
  `conda activate`, so we can configure it as the following:

  ``` powershell
  #!/bin/pwsh
  # $Env:CONDA_PREFIX/etc/conda/activate.d/env_activate.ps1
  Register-AndBackupEnvItemForConda -Name 'CUDA_PATH' -Value $Env:CONDA_PREFIX

  if ($Env:LD_LIBRARY_PATH){
      Register-AndBackupEnvItemForConda -Name 'LD_LIBRARY_PATH' -Value "$Env:CONDA_PREFIX/lib:$Env:LD_LIBRARY_PATH"
  } else {
      Register-AndBackupEnvItemForConda -Name 'LD_LIBRARY_PATH' -Value "$Env:CONDA_PREFIX/lib"
  }

  # Set TF_CUDA_PATHS
  # See https://github.com/tensorflow/tensorflow/blob/bfa5da03f4e1444d4fac777c5ee20b50ed6794b4/third_party/gpus/find_cuda_config.py#L26-L29
  Register-AndBackupEnvItemForConda -Name 'TF_CUDA_PATHS' -Value $Env:CONDA_PREFIX
  ```

  Then, the script file`./deactivate.d/env_deactivate.ps1` will be run
  when `conda deactivate` (include auto `deactivate`), so we can
  configure it as the following:

  ``` powershell
  #!/bin/pwsh
  # $Env:CONDA_PREFIX/etc/conda/deactivate.d/env_deactivate.ps1
  Unregister-WithBackupEnvItemForConda -Name 'CUDA_PATH'
  Unregister-WithBackupEnvItemForConda -Name 'LD_LIBRARY_PATH'
  Unregister-WithBackupEnvItemForConda -Name 'TF_CUDA_PATHS'
  ```

  {% note primary %}

  This step is the most important one of this article. It relates to
  many potential bugs, such as “cannot find cuda/cudnn”, “cannot detect
  GPU”, .etc.

  The commands, `Register-AndBackupEnvItemForConda` and
  `Unregister-WithBackupEnvItemForConda`, are from the installed
  PowerShell module
  [PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp).
  These 2 commands do nothing but help to set and unset `$Env:XXX` and
  `Env:XXX_CONDA_BACK` variables. So, don’t be confused by their very
  long names.

  {% endnote %}

  At last, we can deactivate the conda env and re-activate it. Then, the
  above environment variables’ configuration will take effect.

- Check cuda and cudnn installation:

  First, check `nvcc`:

  ``` powershell
  #!/bin/pwsh
  conda activate ml
  nvcc -V
  ```

  We will see as the following:

  <figure>
  <img
  src="https://raw.little-train.com/ca90060e695c696cf85e34ce1dbf0822ef3f8cd5909fd35814c08e25bfebdb86.png"
  alt="nvcc check" />
  <figcaption aria-hidden="true">nvcc check</figcaption>
  </figure>

  Then, check cuda compiling:

  ``` powershell
  #!/bin/pwsh
  conda activate ml
  cd $HOME
  git clone https://github.com/NVIDIA/cuda-samples.git
  cd cuda-samples/Samples/1_Utilities/deviceQuery
  sudo apt install build-essential
  make clean && make
  ./deviceQuery # check if `Result = PASS`
  cd ../bandwidthTest/
  make clean && make
  ./bandwidthTest # check if `Result = PASS`
  ```

  If the words like Result = PASS is shown, it means the test passed.

  Next, check cudnn compiling:

  - Clone `cudnn_samples_v8` codes and install `libfreeimage-dev`

    ``` powershell
    #!/bin/pwsh
    conda activate ml
    cd $HOME
    git clone https://github.com/johnpzh/cudnn_samples_v8.git
    sudo apt install libfreeimage-dev
    ```

  - Since `cudnn_samples_v8` codes is outdated, we should modify a small
    point of the file`$Home/cudnn_samples_v8/samples_common.mk`:

    ``` powershell
    #!/bin/pwsh
    code $Home/cudnn_samples_v8/samples_common.mk
    ```

    Modify the line 41 from
    `SMS ?= 35 50 53 60 61 62 $(SMS_VOLTA) $(SMS_A100)` to
    `SMS ?= 50 53 60 61 62 $(SMS_VOLTA) $(SMS_A100)`, i.e., delete `35`
    from `SMS`.

  - Then we can continue to compile and test:

    ``` powershell
    #!/bin/pwsh
    conda activate ml
    cd $HOME
    cd cudnn_samples_v8/mnistCUDNN/
    make clean && make
    ./mnistCUDNN # check if `Test passed!`
    ```

  If the words like Result = PASS is shown, it means the test passed.

## Install TensorFlow(GPU)

If the above steps have been done well, the remaining steps will be very
easy:

``` powershell
#!/bin/pwsh
conda activate ml
pip install tensorflow[and-cuda]
```

Check the version of tensorflow and keras :

``` powershell
#!/bin/pwsh
pip show tensorflow keras
```

<figure>
<img
src="https://raw.little-train.com/b5f66901d7f0ad29db86d4073c9e5a0024236588447cc9858b033df432d816ef.png"
alt="check the version of tensorflow and keras" />
<figcaption aria-hidden="true">check the version of tensorflow and
keras</figcaption>
</figure>

And test the installation:

``` powershell
#!/bin/pwsh
python
```

Then, type in (copy and paste) the following codes(even in command
line):

``` python
import tensorflow as tf
mnist = tf.keras.datasets.mnist

(x_train, y_train),(x_test, y_test) = mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0

model = tf.keras.models.Sequential([
  tf.keras.layers.Flatten(input_shape=(28, 28)),
  tf.keras.layers.Dense(128, activation='relu'),
  tf.keras.layers.Dropout(0.2),
  tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam',
  loss='sparse_categorical_crossentropy',
  metrics=['accuracy'])

history = model.fit(x_train, y_train, epochs=5)
history.history
model.evaluate(x_test, y_test)
exit()
```

At last, we should see the training and evaluating procedures smoothly
as:

<figure>
<img
src="https://raw.little-train.com/833fd3a923eefda8a115c95111152da9af679fece31795b1355174428aae34e7.png"
alt="tensorflow GPU test" />
<figcaption aria-hidden="true">tensorflow GPU test</figcaption>
</figure>

At this point, we have installed
[TensorFlow(GPU)(2.6.1)](https://github.com/tensorflow/tensorflow/releases/tag/v2.16.1),
with
[keras(3.0.5)](https://github.com/keras-team/keras/releases/tag/v3.0.5)
successfully.

# Conclusion

This article introduces my steps of installing and using
[TensorFlow(GPU)(2.6.1)](https://github.com/tensorflow/tensorflow/releases/tag/v2.16.1),
with
[keras(3.0.5)](https://github.com/keras-team/keras/releases/tag/v3.0.5)
on WSL2. Different from normal tutorials, I use conda to manage an
environment to install cuda and cudnn. Then, I install TensorFlow(GPU)
to this environment.

The specific environment (version number) is:

- WSL2: `2.0.14.0`
- WSL2’s Linux system：`Ubuntu22.04`
- PowerShell: `7.4.1`
- PSComputerManagementZp: `0.1.3`
- Conda: `24.1.2`
- Cuda: `12.4.0`
- Cudnn: `8.9.7.29`
- Python: `3.12.2`
- TensorFlow: `2.16.1`
- Keras: `3.0.5`

Now, you can take all above steps on your own. Wish you a successful
installation!

# Reference

- [How to Compile TensorFlow-GPU both on Linux (WSL2) and Window \|
  Little Train’s Blog
  (little-train.com)](https://little-train.com/posts/9f6c2fd1.html)
