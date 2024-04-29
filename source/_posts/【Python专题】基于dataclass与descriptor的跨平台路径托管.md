---
abbrlink: 394edaa0
categories: Personal Experiences
date: "2023-10-25 16:22:37"
tags:
- Python
title: Host(manage) multiple path by `dataclass` and `descriptor` in
  Python
updated: "2023-11-11 22:06:36"
---

This article shows an approach in Python about how to host(manage)
`multiple paths` from a config file and only expose one result to the
user automatically.

<!-- more -->

# Introduction

The `multiple paths` means a group of paths in a config file like:

``` yaml
path:
  Windows: E:/Datasets/BraTS/BraTS2022
  Linux: /mnt/e/Datasets/BraTS/BraTS2022
```

Or, it can be regarded as a nested `dict` in Python as:

``` python
multiple_paths = {
    'path':{
        'Windows':'E:/Datasets/BraTS/BraTS2022',
        'Linux':'/mnt/e/Datasets/BraTS/BraTS2022'
    },
}
```

Consider working on a cross-platform scenario with a uniform config
file, where we may develop on Windows and deploy on a remote machine,
such as [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install),
but the data is stored on Windows and is not transferred to WSL2. To be
more concreate, consider a work that builds and manages a batch of
customized meta data for
[BraTS](https://www.synapse.org/#!Synapse:syn27046444/wiki/616571)
dataset in Medical Machine Learning in Python.

In this circumstance, automatically hosting(managing) the cross-platform
data paths (`multiple paths`) and only expose on result to the user can
help us strip out the logic for path conversion from core codes when
migrating from development to deployment, i.e., if we host(manage) all
paths of all different platforms and make then dynamically return a
target result according to the current platform, then we do not need to
worry about converting paths when platform changing.

So, the above hosting(managing) can be regarded as a decoupling of
complex logic. It requires a uniform config file that has contained all
paths of all different platforms already. Therefore, it brings
consistency in the cross-platform paths.

# Method

Provided we have get an example `multiple_paths` as the previous section
from a config file, the following shows a method to deal with example to
realize hosting(managing) `multiple paths` eventually.

- First, create a class that record paths:

  ``` python
  import pathlib
  import platform
  from typing import Literal
  from typeguard import typechecked
  class CrossPlatformPath:
      """    
      Consider a same `Drive` that is available on different platforms.
      A same directory in this `Drive` can be represented as different paths according different platforms.
      Generally, these paths have different headers but a same main-body. 
          Such as:
              d:/a/b/c in Windows
              /mnt/d/a/b/c in Linux (WSL)
      This calss can record a directory's (but not check if it is a dir or file) all paths of different platforms, and
      return a suitable path when need. So, users need not to consider the platform 
      difference any more after initial this class.
      """
      @typechecked
      def __init__(self,paths:dict[Literal['Windows','Linux'],str]) -> None:
          windows = pathlib.PureWindowsPath(paths['Windows'])
          linux = pathlib.PurePosixPath(paths['Linux'])
          assert windows.is_absolute()
          assert linux.is_absolute()    
          # get headers and bodies  
          # bodies are identical in actual content, but will differ in form since they are from different platforms.
          windows = windows.as_posix()
          linux =  linux.as_posix()   
          for index,item in enumerate(zip(windows[::-1],linux[::-1])):
              if item[0]!=item[1]:
                  break
          self.header = {
              'Windows':  pathlib.PureWindowsPath(windows[:-index:]),
              'Linux': pathlib.PurePosixPath(linux[:-index:])
          }
          windows = pathlib.PureWindowsPath(windows)
          linux = pathlib.PurePosixPath(linux)
          # see https://docs.python.org/zh-cn/3/library/pathlib.html?highlight=pathlib#pure-paths
          # since windows and linux have different definitions of relative and absolute path
          # here we must deal with `body` respectively
          self.body = {
              'Windows': str(windows.relative_to(self.header['Windows'])),
              'Linux': str(linux.relative_to(self.header['Linux']))
          }
          assert self.header['Windows']/self.body['Windows'] == windows
          assert self.header['Linux']/self.body['Linux'] == linux
      @property
      def platform_name(self):
          return platform.system()
      def __eq__(self, __o: str|pathlib.PurePath) -> bool:
          return self.dynamic_value == pathlib.PurePath(__o)
      @property
      def dynamic_value(self)->pathlib.PurePath:
          return self.header[self.platform_name]/self.body[self.platform_name]
      def get_specific_value(self,platform_name):
          return self.header[platform_name]/self.body[platform_name]
  ```

  This class mainly use `pathlib` to achieve the following targets:

  - Normalize paths to corresponding styles.
  - Divide paths into `header` and `body`, where `body` contains the
    same part across all paths.
  - Define `dynamic_value` as the exposed one.
  - Define `get_specific_value` to support manually operation.
  - Define `__eq__` to support comparison.

- Then, refer to [\[Descriptor\]Managed
  attributes](https://docs.python.org/3/howto/descriptor.html#id5) and
  create a descriptor class to host(manage) an attribute:

  ``` python
  class CrossPlatformPathDescriptor:
      def __set_name__(self, owner, name):
          self._name = f"_{name}"
      def __get__(self, obj, type):
          value : CrossPlatformPath = getattr(obj, self._name)
          return value.dynamic_value
      def __set__(self, obj, value : dict):
          setattr(obj, self._name, CrossPlatformPath(value))
  ```

- At last, refer to [\[Dataclass\]Descriptor-typed
  fields](https://docs.python.org/3/library/dataclasses.html?highlight=dataclasses#descriptor-typed-fields)
  and create a dataclass to record configs:

  ``` python
  @dataclasses.dataclass
  class BraTSMeta():
      name: str
      path: CrossPlatformPathDescriptor = CrossPlatformPathDescriptor()
  ```

# Test

According to the previous illustration on the method, append test as:

``` python
# dataclass_descriptor_test.py
import pathlib
import platform
import dataclasses 
from typing import Literal
from typeguard import typechecked

class CrossPlatformPath:
    ...
class CrossPlatformPathDescriptor:
    ...    
@dataclasses.dataclass
class BraTSMeta():
    ...
if __name__ == '__main__':
    config = {
        'name':'123456abc',
        'path':{
            'Windows':'E:/Datasets/BraTS/BraTS2022',
            'Linux':'/mnt/e/Datasets/BraTS/BraTS2022'
        },
    }
    meta = BraTSMeta(name=config['name'],path=config['path'])
    print(platform.system(), meta.path)
    # Windows E:\Datasets\BraTS\BraTS2022  
    # Linux /mnt/e/Datasets/BraTS/BraTS2022
    print(meta.path==pathlib.PurePath(config['path'][platform.system()]))
    # True    
```

So, from the above testing results, we have achieved the target that
hosting(managing) `multiple paths` and only exposing one result to the
user automatically.

# Analysis and Conclusion

In this article, we have gone through the approach in Python about how
to host(manage) `multiple paths` from a config file and only expose one
result to the user automatically. We have taken an extremally simple
example that builds and manages a batch of customized meta data for
[BraTS](https://www.synapse.org/#!Synapse:syn27046444/wiki/616571)
dataset in Medical Machine Learning in Python, and then we have tested
the feasibility of the illustrated method on hosting(managing)
`multiple paths`.

The method is based on official tutorials, i.e., [\[Descriptor\]Managed
attributes](https://docs.python.org/3/howto/descriptor.html#id5) and
[\[Dataclass\]Descriptor-typed
fields](https://docs.python.org/3/library/dataclasses.html?highlight=dataclasses#descriptor-typed-fields).
So there is no need to worry about the legitimacy and universality of
this method. It does not go off the beaten track.

> In general, a descriptor is an attribute value that has one of the
> methods in the descriptor protocol. Those methods are `__get__()`,
> `__set__()`, and `__delete__()`. If any of those methods are defined
> for an attribute, it is said to be a
> [descriptor](https://docs.python.org/3/glossary.html#term-descriptor)
> and it can override default behavior upon being looked up as an
> attribute.[^1]

Therefore, our method is just making the attribute `path` as a
descriptor, which use `__set__()` to record all paths of all platforms
and use `__set__()` to return result according to current platform
dynamically.

[^1]: (2023, March 28). Descriptor HowTo Guide — Python 3.11.2 documentation. Docs. https://docs.python.org/3/howto/descriptor.html#descriptor-protocol
