---
abbrlink: 48cdc71b
categories: Personal Experiences
date: "2023-10-25 16:22:37"
tags:
- Python
title: Passing and verification of parameters in Python
updated: "2023-11-11 22:07:24"
---

This article records some useful tips and examples for me to using
[PyYAML](https://github.com/yaml/pyyaml) for configuration, i.e.,
passing parameters and verifying parameters for a Python project. The
official tutorials can be find
[here](https://pyyaml.org/wiki/PyYAMLDocumentation).

<!-- more -->

# Precedent Concepts and Analysis

In Python, there are several methods to pass parameters to your project:

- Command-line arguments: Such as use built-in module
  [`argparse`](https://docs.python.org/zh-cn/3.11/library/argparse.html):

  ``` powershell
  python main.py --input input.txt --output output.txt
  ```

  In python:

  ``` python
  # main.py
  import argparse
  parser = argparse.ArgumentParser()
  parser.add_argument('--input',type=str)
  parser.add_argument('--output',type=str)

  args = vars(parser.parse_args())

  print(args['input'])
  print(args['output'])
  ```

- Configuration files: Such as use built-in module
  [`configparser`](https://docs.python.org/zh-cn/3.11/library/configparser.html)
  to read configuration files:

  ``` ini
  # example.ini
  [DEFAULT]
  input = input.txt
  output = output.txt
  ```

  In python:

  ``` python
  import configparser
  config = configparser.ConfigParser()
  config.read('example.ini')
  default_config = config['DEFAULT']
  print(default_config['input'])
  print(default_config['output'])
  ```

- Environment variables: Such as use built-in module
  [`os`](https://docs.python.org/zh-cn/3.11/library/os.html?highlight=os#os.environ)
  to read environment variables:

  ``` powershell
  $Env:INPUT='input.txt'
  $Env:OUTPUT='output.txt'
  ```

  Then in python：

  ``` python
  import os
  input_file = os.environ.get('INPUT')
  output_file = os.environ.get('OUTPUT')
  ```

- Internal program variables: Setting default values in the program:

  ``` python
  input_file = 'input.txt'
  output_file = 'output.txt'
  ```

- Interactive input: Such as use the built-in module `input`:

  ``` python
  input_file = input("input:")
  output_file = input("output:")
  print(input_file)
  print(output_file)
  # input:input.txt
  # output:output.txt
  # input.txt
  # output.txt
  ```

When a Python project is large enough and has many parameters, we need
to consider an optimal way to pass the parameters. From my point of
view, if we are in a project’s developing procedure, or for those
projects that require frequent parameter adjustments, the best way is to
use configuration files:

- The method `environment variables`, `internal program variables`, and
  `interactive input` should be omitted because they are not only
  cumbersome but also too simple in terms of the functions they can
  achieve.
- The method `command-line arguments` can provide good interaction with
  general users. With its supported help information, users can learn
  the details of the parameters in place and start using them without
  having to check the source code. What’s more, argument validation is
  also supported, like
  [here](https://docs.python.org/zh-cn/3.11/library/argparse.html?highlight=argpars#type).
  However, for a project’s developer, who has known all parameters in
  advance, it is very cumbersome to enter or modify parameters as
  lengthy as a paper in the command line. Of course, at this point, we
  can save parameters to a file, parsing parameters from the file
  directly as
  [here](https://docs.python.org/zh-cn/3.11/library/argparse.html?highlight=argpars#fromfile-prefix-chars).
  But, if so, there may be no difference between this and
  `configuration files` for developers.
- The method `configuration files` is one of the most explicit methods
  for decoupling parameters and programs. Because through some
  protocols, the configuration file simplifies the transferred
  information, and the user almost only needs to consider how the
  information is organized in a mapping structure of parameter names and
  values, without caring about the platform, language, and complicated
  programming syntax. Of course, due to the cross-platform,
  cross-language versatility of the configuration file, an intermediate
  level is necessary to achieve special functions like built-in
  `argparse`. Generally, as a disadvantage, users need to write a file
  specially to read and verify the parameters parsed from some
  `configuration files`, and the source file is needed for users to know
  all parameters’ details. However, it doesn’t mean this is cumbersome.
  Because if a program executes the logic of parameter parsing and
  verification, the corresponding information should be given in
  advance. This method does not require the user give redundant
  information, but only necessary information. Even though a
  `command-line arguments` method, such as `argparse`, seems convenient,
  it is just because `argparse` provides some quick methods to simplify
  the specific steps of parameters’ parsing and verification, but these
  two steps are never ignored or omitted.
- So, in a sense, `command-line arguments` require the user to provide
  information at running, while `configuration files` require the user
  to provide information before running, they are both without any
  unnecessary manipulation. When there are a lot of parameters, it is
  obvious that `configuration files` can allow us to deal with parameter
  passing problems more calmly and avoid the dizziness in the face of
  complicated parameter information on the console as
  `command-line arguments` may bring.

In summary, for developers, I think the best method to pass parameters
is by `configuration file`. Then, which way to use `configuration files`
? There are at least 4 prevalent approaches, collected by
[Chat-GPT](https://chat.openai.com/chat):

> - [`configparser`](https://docs.python.org/zh-cn/3.11/library/configparser.html):
>   This is a built-in library in Python that provides a way to read and
>   write configuration files in a standardized format (INI-like). It
>   allows you to create sections and options, and easily access the
>   values in your code.
> - [JSON](https://www.json.org/json-en.html): JSON is a lightweight
>   data-interchange format that is easy to read and write. Python
>   provides a built-in library called `json` that allows you to read
>   and write JSON files. This is a simple and human-readable format,
>   and it can be directly used as a python dictionary.
> - [YAML](https://yaml.org/): YAML is a human-readable data
>   serialization format that is easy to read and write. Python provides
>   a library called `pyyaml` that allows you to read and write YAML
>   files. It is a more flexible format than JSON, it can store and
>   represent more complex data structures such as lists, dictionaries
>   and nested data structures.
> - [TOML](https://toml.io/en/): TOML stands for “Tom’s Obvious, Minimal
>   Language” and is a configuration file format that is easy to read
>   and write. Python provides a library called `toml` that allows you
>   to read and write TOML files. It is similar to INI format and is
>   focused on providing a minimal and easy to use configuration format.

Here we define ‘using `configuration files`’ uniformly as parsing
parameters from a file to a Python dictionary or
[mapping](https://docs.python.org/zh-cn/3/library/collections.abc.html#collections.abc.Mapping)
if be more general. In terms of functionality, `configparser` has morbid
complexity and simplicity. It supports default value management and
semantics guessing. But it cannot support nested data structure
well[^1]. `TOML` supports more functions, but since its orientation is
to be simple, it cannot serialize data structure well directly[^2]
However, serialization of data structure is also an important function
for developers because we sometimes need to save a checkpoint with the
current configurations (arguments). When it comes to `YAML` and `JSON`,
`YAML` has better direct readability than `JSON` and the former supports
comments well.

NOTE: In the above statements, the absolute wording is strongly avoided.
Because the language specification itself is extensible and its
application layer’s implementation is also extensible. This means that
some features will eventually be supported, but not explicitly in
advance because they are not covered by the original definition of the
language specification.

So, eventually, I chose [YAML](https://yaml.org/) and `pyyaml` as the
main way to use `configuration files` to manage parameters. In order to
unify the behavior of parameter management, and for future
extensibility, here we define an<a id="abstract_class"> abstract
class</a> as :

``` python
import pathlib
from typing import Any
class AggregatedConfigManager():
    args:dict
    def __init__(self,path:str) -> None:
        self._path = pathlib.Path(path)
    def load_config(self,use_save_mode:bool=True)->dict[str,Any]:
        """
        A simple aggregation for parsing ini, toml or yaml config files to python dictionary.
        But the returned dictionary is limit to type `dict[str,Any]`, even though yaml 
        supports more complicated forms.
        """
        match suffix:=self._path.suffix: 
            case '.json':
                ...
                self.args = ...
            case '.yaml'|'.yml':
                ...
                self.args = ...
            case '.toml':
                ...
                self.args = ...
            case _:
                raise ValueError(f"The `{suffix}` file is not supported currently.")
        return self.args
    def dump_config(self,path:str,use_save_mode:bool=True)->Any:
        """
        A simple aggregation for dump python dictionary to ini, toml or yaml files.
        But the input dictionary is limit to type `dict[str,Any]`, even though yaml 
        supports more complicated forms.
        """
        _path = pathlib.Path(path)
        match suffix:=_path.suffix:  
            case '.ini':
                ...
            case '.yaml'|'.yml':
                ...
            case '.toml':
                ...
            case _:
                raise ValueError(f"The `{suffix}` file is not supported currently.")
        return ...
```

# Use `PyYAML` to Pass Parameters

- Install `PyYaml` with [pip](https://pypi.org/project/pip/)

  ``` powershell
  pip install pyyaml
  ```

- How to use `PyYaml`?

  **YAML** (/ˈjæməl/ and
  [*YAH-ml*](https://en.wikipedia.org/wiki/Help:Pronunciation_respelling_key))
  (*see [§ History and
  name](https://en.wikipedia.org/wiki/YAML#History_and_name)*) is a
  [human-readable](https://en.wikipedia.org/wiki/Human-readable)
  [data-serialization
  language](https://en.wikipedia.org/wiki/Serialization).[^3] `PyYAML`’s
  is a full-featured YAML processing framework for Python.[^4] What the
  `PyYAML` to do is parsing a
  [serialization](https://en.wikipedia.org/wiki/Serialization) data into
  python a dictionary, which will usually work as a hyper-parameters
  manager to manage a large quantity of parameters that needed for
  programs in a uniform and centralized manner. Therefore, there are
  only 3 key points to understanding `PyYAML`’s usage:

  - Write a correct `.yaml` or `.yml` file to define the expected data,
    such as a<a id="confg.yaml"> `confg.yaml`</a> in [Machine
    Learning](https://en.wikipedia.org/wiki/Machine_learning) scenario:

    ``` yaml
    # confg.yaml
    platform: Auto
    action: train-and-test  
    workspace:
      Windows: X:/Training
      Linux: /mnt/x/Training
    init: init_total_1
    indicator: seed_test_11
    device: 0
    global_random_seed: 2
    sql:
      backend: mysql
      mysql:
        host_platform: Windows
        host: 
          Windows: '127.0.0.1'
          Linux: '127.0.0.1'
        port: 3306
        user: root
        passwd: xxxxxxxxxxxxx
        database_config_path:
          brats: 'config/SQL/brats.sql'
          ixi: 'config/SQL/ixi.sql'
    dataset:
      name: "brats"
      brats:
        path: # will be reduced to one of the platform's value
          Windows: E:/Datasets/BraTS/BraTS2022
          Linux: /mnt/e/Datasets/BraTS/BraTS2022
        shuffle_seed: 1000
        dividing_rates: [0.7, 0.2, 0.1]
        dividing_seed: 1000
        norm: min_max_on_z_score
        raw_data_format: DHW
        target_orientation: RAS+
        use_patch: true
        overlap_tolerances: [[0.2, 0.3], [0.2, 0.3], [0.2, 0.3]]
        patch_sizes: [64, 64, 64]
        patch_nums: [1, 3, 3]
        domain: [0.0, 1.0]
      ixi:
        path:  # will be reduced to one of the platform's value
          Windows: E:/Datasets/IXI/
          Linux: /mnt/e/Datasets/IXI/
    ```

  - Write a correct procedure to parse the former `.yaml` or `.yml`
    file, such as:

    ``` python
    import yaml
    with open('./confg.yaml', 'r', encoding='utf-8') as file:
        config = yaml.safe_load(stream=file)
    ```

    Here we use `yaml.safe_load` because:

    > **Warning: It is not safe to call `yaml.load` with any data
    > received from an untrusted source! `yaml.load` is as powerful as
    > `pickle.load` and so may call any Python function.** Check the
    > `yaml.safe_load` function though.[^5]

  - Verify the legitimacy of all parameters in the parsed dictionary.
    See latter.

  So, we should make sure the **security** of the parsing process. Then,
  we have better to make sure all configuration info in the parsed
  dictionary is legal for our target program, since this configuration
  method lacks those methods of arguments checking in
  [`argparse`](https://docs.python.org/3/library/argparse.html).

# Parameters Verification

In Python, there are several methods to realize parameter verification.

- Customization:
  - `if-else` to deal with different parameters.
  - `rasie` errors.
  - `assert` some verification.
- By built-in standard library:
  - [argparse](https://docs.python.org/zh-cn/3/library/argparse.html):
    The
    [`argparse`](https://docs.python.org/zh-cn/3/library/argparse.html#module-argparse)
    module makes it easy to write user-friendly command-line interfaces.
    The program defines what arguments it requires, and
    [`argparse`](https://docs.python.org/zh-cn/3/library/argparse.html#module-argparse)
    will figure out how to parse those out of
    [`sys.argv`](https://docs.python.org/zh-cn/3/library/sys.html#sys.argv).
    The
    [`argparse`](https://docs.python.org/zh-cn/3/library/argparse.html#module-argparse)
    module also automatically generates help and usage messages. The
    module will also issue errors when users give the program invalid
    arguments.[^6]
- By third-party libraries:
  - [pydantic](https://docs.pydantic.dev/latest/): Data validation and
    settings management using Python type annotations. **pydantic**
    enforces type hints at runtime, and provides user friendly errors
    when data is invalid. Define how data should be in pure, canonical
    Python; validate it with **pydantic**. [^7]
  - [schema](https://github.com/keleshev/schema): **schema** is a
    library for validating Python data structures, such as those
    obtained from config-files, forms, external services or command-line
    parsing, converted from JSON/YAML (or something else) to Python
    data-types. [^8]
  - [cerberus](https://docs.python-cerberus.org/en/stable/index.html):
    **Cerberus** provides powerful yet simple and lightweight data
    validation functionality out of the box and is designed to be easily
    extensible, allowing for custom validation. [^9]
  - [marshmallow](https://github.com/marshmallow-code/marshmallow):
    **marshmallow** is an ORM/ODM/framework-agnostic library for
    converting complex datatypes, such as objects, to and from native
    Python datatypes.[^10]

**NOTICE**: Here the parameter verification is not a validation of the
legitimacy for Python functions but a Python project/program.

Here we have chosen `pydantic` without any additional reason, even
though the above methods can all help us to verify parameters of the
parsed Python dictionary by `yaml` from `configuration files`.

The validation procedure can be designed as:

- Inherit `BaseModel` of `pydantic` to make a customized verification
  class, such as matching the <a href="#confg.yaml">`confg.yaml`</a>:

  ``` python
  # validation.py
  from datetime import datetime
  from typing import List, Optional, Literal, OrderedDict
  from pydantic import BaseModel,validator
  import pathlib,platform
  import socket

  class _Platform(BaseModel):
      Windows:str 
      Linux:str
  class _PlatformPath(_Platform):
      @validator('Windows')
      def validate_windows_path(cls, v:str):
          path = pathlib.PureWindowsPath(v)
          drive = path.drive
          if drive == '':
              raise ValueError(f"`{str(path)}` is not a excepted window path with dirve name.")
          path = drive.lower()/path.relative_to(drive)
          if (platform.system() == 'Windows') and (not pathlib.Path(path).exists()):
              raise ValueError(f"The path `{path}` does not exist.")
          return str(path)
      @validator('Linux')
      def validate_linux_path(cls, v:str):
          path = pathlib.PurePosixPath(v)
          root = path.root
          if root == '':
              raise ValueError(f"`{str(path)}` is not a excepted linux path with root.")
          if (platform.system() == 'Linux') and (not pathlib.Path(path).exists()):
              raise ValueError(f"The path `{path}` does not exist.")
          return str(path)
  class _MySql(BaseModel):
      host_platform: Literal['Windows','Linux']  
      host: _Platform
      port: int
      user: str
      passwd: str
      database_config_path: dict[Literal['brats','ixi'],str]
      @validator('port')
      def validate_sql_connection(cls,v:int,values, **kwargs):
          host = getattr(values['host'],platform.system())
          port = v
          sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
          result = sock.connect_ex((host, port)) 
          if result != 0:
              raise ValueError(f"`{host}@{port}` is unable to connect.")
          return v      
  class _SQL(BaseModel):
      backend: str
      mysql: _MySql

  class _IXI(BaseModel):
      path: _PlatformPath

  class _BraTS(BaseModel):
      path: _PlatformPath
      shuffle_seed: int
      dividing_rates: tuple[float, float, float]
      dividing_seed: int
      norm: Literal['min_max_on_z_score']
      raw_data_format: Literal['DHW']
      target_orientation: str|tuple[str,str,str]
      use_patch: bool
      overlap_tolerances: tuple[
          tuple[float, float], tuple[float, float], tuple[float, float]
      ]
      patch_sizes: tuple[int, int, int]
      patch_nums: tuple[int, int, int]
      domain: tuple[float, float]
      @validator('target_orientation')
      def validate_orientation(cls,v:str|tuple[str,str,str],values, **kwargs):
          if isinstance(v,tuple):
              return v 
          if len(v)==4:
              assert v.endswith('+')
              v = v.strip('+')
          if len(v)==3:
              return tuple(v.upper())
          else: 
              raise ValueError(f"`{v}` is not supported.")

  class _Dataset(BaseModel):
      name: Literal['brats', 'ixi']
      brats: _BraTS
      ixi: _IXI
  class MriTransGanArgsValidator(BaseModel):
      platform: Literal['Windows','Linux','Auto']  
      action: str
      workspace: _PlatformPath
      init: str
      indicator: str
      device: int
      global_random_seed: int
      sql: _SQL
      dataset: _Dataset
      @validator('platform')
      def specify_platform(cls, v:str):
          return platform.system() if v=='Auto' else v
      def get_reduced(self):
          instance = self.copy(deep=True)
          instance.workspace = getattr(instance.workspace,platform.system())
          instance.sql.mysql.host  = getattr(instance.sql.mysql.host,platform.system())
          instance.dataset.brats.path = getattr(instance.dataset.brats.path,platform.system())
          instance.dataset.ixi.path = getattr(instance.dataset.ixi.path,platform.system())
          return instance
  ```

- Consider we have made a class `AggregatedConfigManager` as
  <a href="#abstract_class">the abstract calss</a> to pass
  <a href="#confg.yaml">`confg.yaml`</a> to Python dictionary as:

  ``` python
  import pathlib
  import os 
  from typing import Any
  from typeguard import typechecked
  from pydantic import BaseModel
  # YAML, see https://pyyaml.org/wiki/PyYAMLDocumentation
  import yaml 
  try:
      from yaml import CLoader as YamlLoader, CDumper as YamlDumper
  except ImportError:
      from yaml import YamlLoader, YamlDumper

  # TOML, see https://github.com/hukkin/tomli
  try:
      import tomllib
  except ModuleNotFoundError:
      import tomli as tomllib

  import configparser
  import json 
  import pickle
  import pickletools
  import hashlib
  import copy
  from .hash_manager import dict2hash
  class AggregatedConfigManager:
      """
      Aggregated config manager. 
      Features: 
          load config dict from file
          validate config
          dump config to file (maintain original order, do not sort)

          `_config` is unreduced config, and it is the original one that loaded from file
          `_config` is not exposed to user directly 
          dump,load and calaulate fingerprint are all based on `_config`
          config is exposed to user, and it is the reduced one

      NOTE Currently, since `configparser` does not work on a simple real dict data structure,
           it is hard to make `.ini` involve and maintain the simplicity of this class at the same time. 
           So, the supported backend is only `.toml`, `.yaml` or `.yml` and `.json` file, excluding `.ini` file.  
      Deprecated methods for `.ini` file.
          def read_ini(path):
              origin = configparser.ConfigParser()
              origin.read(path)
              config = {item:{**origin[item]} for item in origin.sections()}
              return origin,config
          def dump_ini(path):
              with open(path, 'w') as file:
                  output_config = self.origin.write(file)
              assert output_config is None
      """
      def __init__(self,path:str,validator_class:type) -> None:
          self._path = pathlib.Path(path)
          self._validator_class = validator_class

      @property
      def config(self)->dict[str,Any]:
          if not hasattr(self,"_validator"):
              self._validator:BaseModel = self._validator_class(**self.load_config(use_save_mode=True))
          if not hasattr(self,"_config"):
              self._config = self._validator.dict() # Force to dict  
          return self._validator.get_reduced().dict() # Force to dict  
      @typechecked
      def load_config(self,use_save_mode:bool=True)->dict[str,Any]:
          """
          A simple aggregation for parsing json, toml or yaml config files to python dictionary.
          But the returned dictionary is limit to type `dict[str,Any]`, even though yaml 
          supports more complicated forms.
          """
          match suffix:=self._path.suffix: 
              case '.json':
                  with open(self._path, 'r', encoding='utf-8') as file:
                      config = json.load(file)
              case '.yaml'|'.yml':
                  with open(self._path, 'r', encoding='utf-8') as file:
                      if use_save_mode:
                          config = yaml.safe_load(stream=file)
                      else:
                          config = yaml.load(stream=file,Loader=YamlLoader)
              case '.toml':
                  with open(self._path, 'rb') as file:
                      config = tomllib.load(file)
              case _:
                  raise ValueError(f"The `{suffix}` file is not supported currently.")
          return config
      @typechecked
      def dump_config(self,path:str,use_save_mode:bool=True)->Any:
          """
          A simple aggregation for dump python dictionary to json, toml or yaml files.
          But the input dictionary is limit to type `dict[str,Any]`, even though yaml 
          supports more complicated forms.

          Sorting is disabled, the original order will be maintained.
          """

          _path = pathlib.Path(os.path.normpath(path))
          _path.parent.mkdir(parents=True, exist_ok=True)
          match suffix:=_path.suffix: 
              case '.json':
                  with open(_path, 'w', encoding='utf-8') as file:
                      output_config = json.dump(self._config,file)
                  assert output_config is None
              case '.yaml'|'.yml':
                  with open(_path, 'w', encoding='utf-8') as file:
                      if use_save_mode:
                          output_config = yaml.safe_dump(self._config,stream=file,sort_keys=False)
                      else:
                          output_config = yaml.dump(self._config,stream=file,Dumper=YamlDumper,sort_keys=False)
                  assert output_config is None # if stream is given and work, the above will return None
              case '.toml':
                  raise ValueError(f"The `{suffix}` file is not supported currently.")
              case _:
                  raise ValueError(f"The `{suffix}` file is not supported currently.")
          return output_config
      @property
      def suffix(self) -> str:
          return self._path.suffix
      @property
      def fingerprint(self) -> int:
          return dict2hash(self._config)
  ```

- Then, we can do as:

  ``` python
  acm = AggregatedConfigManager('./config.yaml',validator_class=MriTransGanArgsValidator)
  print(acm)
  print(acm.config)
  ```

In the above codes, we not only verify the parameters, but also add more
features:

- Generate `fingerprint`s by all parameters as identifications (IDs) to
  determine whether two configurations (2 sets of parameters) are
  identical. See the function in [A.1 `dict2hash`](#A.1 `dict2hash`).
- Test the legitimacy of the path parameters (`_PlatformPath`,
  `workspace`).
- Reduce multiple parameter contents by current platform (`workspace`,
  `sql.mysql.host`, `dataset.brats.path`, `dataset.ixi.path`):
  - advantages:
    - It is convenient for post-stage procedures to use these
      parameters, since they need not select parameters according to the
      current platform and just use it.
    - It is convenient for decoupling the logic of parameter validation
      and parameter working.
  - disadvantages:
    - We should reduce multiple parameters after the procedure of
      getting `fingerprint` instead of before it. Because the
      `fingerprint` is for identifying configurations instead of for
      using parameters on post-stage procedures. So, it brings more
      coding.
    - For developers, they need to pay more attention on
      `verification parts` to know which parameters should be reduced
      and how to use, instead of just considering `configuration files`
      and `post-stage procedures`.

# Tips and References

- [configparser — 配置文件解析器 — Python 3.11.3
  文档](https://docs.python.org/zh-cn/3.11/library/configparser.html)
- [JSON](https://www.json.org/json-en.html)
- [The Official YAML Web Site](https://yaml.org/)
- [TOML: 简体中文 v1.0.0](https://toml.io/cn/v1.0.0)

# Appendix

## A.1 `dict2hash`

``` python
import hashlib
from typeguard import typechecked
from typing import Literal
import json

def __nested_dict_sort(maybe_nested_dict:dict)->dict:        
    maybe_nested_dict = dict(sorted(maybe_nested_dict.items(),key=lambda kv:str(kv[0]).lower()))
    for key,value in maybe_nested_dict.items():
        if isinstance(value,dict):
            maybe_nested_dict[key] = __nested_dict_sort(value)
    return maybe_nested_dict 

def __serialization(data:dict)->bytes:
    """
    在python的对象中,会存在很多值相等但对象本身并非同一个对象的例子.
    这个现象导致我们用pickle序列化从配置文件读取的字典并不一定具有一致性.
    参见 https://stackoverflow.com/questions/75161167/why-the-parsed-dicts-are-equal-while-the-pickled-dicts-are-not
    例如,从JSON配置文件,读取出现第二次的键名,该过程会被优化,第二次出现的键名将和第一次出现的键名完全相同,共用同一ID.
        而从YAML配置文件去读出现第二次的键名,没有优化措施,新的对象被照常建立.
    除此之外,字典的键插入顺序, set 与 frozenset, int 与 float 都是值可能相等但并非同一对象的例子.
    因此,使用pickle序列化从配置文件解析得到的字典,即使我们排序了,也不一定能获得一致性.
    所以,最佳的序列化方法应当是使用json.dumps, 即将所有的配置同一为字典序列化后的字符串,这样,我们肉眼所得的一致性就和序列化后的一致性趋同了.
    已弃用:
        return pickle.dumps(__nested_dict_sort(self.config))
        return pickletools.optimize(pickle.dumps(__nested_dict_sort(self.config)))         
    """
    return json.dumps(__nested_dict_sort(data)).encode('utf-8')   

@typechecked
def dict2hash(data:dict,name:Literal['sha256','sha512']='sha256'):
    h = hashlib.new(name)
    h.update(__serialization(data))
    return h.hexdigest()
```

[^1]: (2023, January 16). toml-lang/toml: Tom’s Obvious, Minimal Language. Github. https://github.com/toml-lang/toml

[^2]: (2023, January 16). toml-lang/toml: Tom’s Obvious, Minimal Language. Github. https://github.com/toml-lang/toml

[^3]: (2023, January 10). YAML - Wikipedia. En. https://en.wikipedia.org/wiki/YAML

[^4]: (2023, January 10). yaml/pyyaml. Github. https://github.com/yaml/pyyaml

[^5]: (2023, May 22). https://pyyaml.org/wiki/PyYAMLDocumentation. Pyyaml. https://pyyaml.org/wiki/PyYAMLDocumentation

[^6]: (2023, May 23). argparse — 命令行选项、参数和子命令解析器 — Python 3.11.3 文档. Docs. https://docs.python.org/zh-cn/3/library/argparse.html

[^7]: (2023, May 23). Pydantic. Docs. https://docs.pydantic.dev/latest/

[^8]: (2023, May 23). keleshev/schema: Schema validation just got Pythonic. Github. https://github.com/keleshev/schema

[^9]: (2023, May 23). Welcome to Cerberus — Cerberus is a lightweight and extensible data validation library for Python. Docs. https://docs.python-cerberus.org/en/stable/index.html

[^10]: (2023, May 23). marshmallow-code/marshmallow: A lightweight library for converting complex objects to and from simple Python datatypes.. Github. https://github.com/marshmallow-code/marshmallow
