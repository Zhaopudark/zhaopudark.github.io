---
abbrlink: e11578be
categories: Personal Experiences
date: "2024-02-24 02:21:07"
tags:
- PowerShell
- Windows
- Environment Variables
title: "【PowerShell模组开发日志】环境变量路径`$Env:Path`的简单管理(添加、删除、去重)"
updated: "2024-02-26 10:07:10"
---

本文是PowerShell模组
[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)
的使用案例分享。记录了通过该自定义模组，管理多个层级`$Env:Path`的过程。包括添加、删除、去重等。本文的案例非常适合于使用PowerShell进行系统管理，工具调用等行为的场景。

<!-- more -->

# 基本概念与动机

> **环境变量**：**环境变量**是一个[动态命名](https://zh.wikipedia.org/wiki/名字解析_(程序设计))的[值](https://zh.wikipedia.org/wiki/值_(電腦科學))，可以影响计算机上[进程](https://zh.wikipedia.org/wiki/进程)的行为方式。例如一个正在运行的进程可以查询TEMP环境变量的值，以发现一个合适的位置来存储临时文件，或者查询HOME或USERPROFILE变量，以找到运行该进程的用户所拥有的[目录结构](https://zh.wikipedia.org/wiki/目錄結構)。
>
> **`$Env:Path`**:
> **PATH**是[类Unix系统](https://zh.wikipedia.org/wiki/类Unix系统)、[DOS](https://zh.wikipedia.org/wiki/DOS)、[OS/2](https://zh.wikipedia.org/wiki/OS/2)和[Microsoft
> Windows](https://zh.wikipedia.org/wiki/Microsoft_Windows)[操作系统](https://zh.wikipedia.org/wiki/操作系统)上的一个[环境变量](https://zh.wikipedia.org/wiki/环境变量)，用于设置一组包含[可执行文件](https://zh.wikipedia.org/wiki/可执行文件)的[目录](https://zh.wikipedia.org/wiki/目录_(文件系统))。

在所有的环境变量中，我们关心的最多的，一般就是`$Env:Path`，因为其涉及诸多软件工具之间的相互配合与调用流程。当我们使用PowerShell等命令工具(或者说是shell)还安装使用
[Miniconda](https://docs.anaconda.com/free/miniconda/),
[MSYS2](https://www.msys2.org/)
等带有**包管理器**，实现独立的**包管理模式** 的工具时，`$Env:Path`
将可能给我们带来一些不便之处。

## Windows 系统环境变量的三个层级

参考 [EnvironmentVariableTarget Enum
(System)](https://learn.microsoft.com/zh-cn/dotnet/api/system.environmentvariabletarget?view=net-8.0#fields)，在Windows系统中，有三个级别的环境变量，分别是
`Machine`级别 、`Process` 级别和`User`
级别。如果将“控制和管理Windows系统”的过程抽象为“用户通过一定的接口与行为模式，与系统进行交互”，那么Windows系统的特殊性就在于，通过GUI和通过命令行，都可以实现大部分的用户需求。具体到环境变量时，我们至少有三种用户层面的控制环境变量的方案：

1.  通过[注册表(registry)](https://learn.microsoft.com/zh-cn/windows/win32/sysinfo/registry)编辑器GUI控制：修改和存储
    `HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\Session Manager\Environment`
    和 `HKEY_CURRENT_USER\Environment` 的记录值。
2.  通过Windows系统设置GUI控制：打开
    `设置>系统>系统信息>高级系统设置>环境变量` 进行修改和存储。
3.  通过命令行控制：可以通过cmd或者PowerShell，以及对应的命令，修改和存储环境变量。

{% note info %}

上述三种方法之所以称之为用户层面，是因为其实现逻辑在系统层面可能是有重叠的、甚至是一致的。但是作为用户而言，我们不需要也不应当去关心系统层面的逻辑，只需要关注自己的行为模式是否有区分性即可。

{% endnote %}

## `$Env:Path` 的不便之处

一般情况下，当我们在Windows终端使用PowerShell时，使用 `Process`
级别的环境变量，其会按照一定的优先级，包含并整合`Machine`级别和 `User`
级别环境变量中设置的内容。鉴于控制环境变量的方式很多，意味着环境变量值的来源就很多，在我们日常使用中，就很可能遇到一些问题，特别是环境变量中的路径`$Env:Path`：

- `Machine`级别和 `User`
  级别环境变量`$Env:Path`中存在**重复**：安装某些软件时，会根据用户的选择，向系统注入`Machine`级别或者`User`
  级别`$Env:Path`追加内容，但卸载软件时，不一定会自动清除。如果用户前后反复卸载，安装，且选择不一致，可能会导致重复。

  {% note success %}

  这种重复不会直接导致问题，但会构成隐患。可能会导致根据`$Env:Path`
  寻找到软件或工具时，其版本不是目标版本等问题。

  {% endnote %}

- `Machine`级别和 `User`
  级别环境变量`$Env:Path`中存在**空值**：某些软件卸载后，虽然会清除`$Env:Path`中的相应路径，但可能会引入空值。

  {% note success %}

  这种空值不会直接导致问题，且大部分情况下，都不影响使用。但是，如果基于`$Env:Path`的下游程序，需要对`$Env:Path`进行继承、修改时，空值可能会导致一些意外情况，尤其是空值出现在`$Env:Path`的中部而非首尾时。

  {% endnote %}

再例如：当我们同时使用[Miniconda](https://docs.anaconda.com/free/miniconda/),
[MSYS2](https://www.msys2.org/)
等带有**包管理器**，实现独立的**包管理模式**
的工具时，我们如果想安装[Git](https://git-scm.com/download/win)，就可以有三种选择：

- 安装到`conda`的虚拟环境中
- 安装到`msys2`的环境中
- 安装到一般的Windows程序文件夹`‪Program Files`中

然后，我们可能会在`$Env:Path`的多个子条目路径中，寻找到`git.exe`。为了确保使用的是我们期望的`git.exe`,
我们可能会在PowerShell的配置文件`$PROFILE.CurrentUserAllHosts`中进行提前的处理，将我们期望的路径**前置**。如果我们每安装一个应用，调用时都要考虑类似于`git.exe`
在`$Env:Path` 中的**前置**问题，将会比较繁琐，麻烦。

## 动机总结

上述`$Env:Path`
中的处理过程尽管麻烦，但是其本身依旧是不可或缺的。但是，这套处理过程是可以整合的，以减少在`$PROFILE.CurrentUserAllHosts`配置文件中的配置行数，让用户从关心如何处理`$Env:Path`的过程中解放出来，只需要关心是否需要将某个路径加入到`$Env:Path`中。因此，PowerShell模组
[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)
将一些处理`$Env:Path`的逻辑进行了打包和封装，参见[EnvPath.ps1](https://github.com/Zhaopudark/PSComputerManagementZp/blob/main/Module/Public/Classes/EnvPath.ps1)
和
[Manager.Env.ps1](https://github.com/Zhaopudark/PSComputerManagementZp/blob/main/Module/Public/Manager.Env.ps1)。后文就将介绍使用这套逻辑的案例，以更便捷的方式管理`$Env:Path`。

# 准备工作

本节简述如何配置工具与环境

## 将PowerShell更新到7.0以上

可以直接从[Release of PowerShell · PowerShell/PowerShell
(github.com)](https://github.com/PowerShell/PowerShell/releases/latest)
下载安装，或者使用
[winget-cli](https://github.com/microsoft/winget-cli):

``` powershell
winget search powershell
winget install --id Microsoft.PowerShell
```

## 安装PowerShell模组PSComputerManagementZp

参考 [PowerShell Gallery \| PSComputerManagementZp
0.1.0](https://www.powershellgallery.com/packages/PSComputerManagementZp/0.1.0):

``` powershell
Install-Module -Name PSComputerManagementZp -Force
```

# 使用案例

以管理员权限运行PowerShell，再下面的流程中不要退出该shell窗口。

{% note primary %}

以下所有函数，都基于一个自定义的类
[EnvPath](https://github.com/Zhaopudark/PSComputerManagementZp/blob/main/Module/Public/Classes/EnvPath.ps1)，该类被初始化时，会自动对每个层级的`$Env:Path`内部去重，删除空值和点值`.`

面向`Process`级别`$Env:Path`的函数，同样适用于Linux和Mac系统中，已被[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)支持，并通过了测试。

{% endnote %}

## 将`Machine`层级与`User`层级的`$Env:Path`中的重复项合并到`User`层级

``` powershell
Merge-RedundantEnvPathFromCurrentMachineToCurrentUser
```

此函数将帮助用户，检查`Machine`层级与`User`层级的`$Env:Path`中的重复项。对于重复项，将删除`Machine`层级中的，只保留`User`层级中的。这个方法非常适用于单用户的Windows系统，曾经多次以不同权限安装、卸载过某个软件，而`$Env:Path`残留了安装路径的情况。

{% note info %}

对于这种行为，可能会有人不解、困惑甚至反对。但此处提现的思想是，希望用户配置对系统的影响范围最小。即使用户是管理员，我们也认为，用户的配置应当尽可能只影响以其账号登录的系统，而尽可能不影响其他账号登录的系统。如果保留`Machine`层级，删除`User`层级，那么，新用户将拥有其不知晓的`$Env:Path`内容，这在一般意义上，我们认为是不够好的。当然，这个做法不完美，最终用户是否选择使用，需要结合具体情况考虑。

{% endnote %}

## 将某个路径添加到`$Env:Path`

- 添加到当前`Process`级别`$Env:Path`的开头：

  {% note primary %}

  添加到当前`Process`级别意味着仅在当前运行的PowerShell的Scope有效，重启PowerShell等重置Scope的方法将会导致对当前`Process`级别`$Env:Path`的配置失效。但这也是我们在命令行中使用一些工具的一般做法，即，使用时再临时添加，不保存，以避免不同场景下的路径冲突。

  {% endnote %}

  ``` powershell
  Add-PathToCurrentProcessEnvPath -Path 'C:\Program Files\Git\cmd' # Default is prepend
  ```

- 添加到当前`Process`级别`$Env:Path`的末尾：

  ``` powershell
  Add-PathToCurrentProcessEnvPath -Path 'C:\Program Files\Git\cmd' -IsAppend
  ```

- 添加到当前`User`级别`$Env:Path`的开头：

  ``` powershell
  Add-PathToCurrentUserEnvPath -Path 'C:\Program Files\Git\cmd' # Default is prepend
  ```

- 添加到当前`User`级别`$Env:Path`的末尾：

  ``` powershell
  Add-PathToCurrentUserEnvPath -Path 'C:\Program Files\Git\cmd' -IsAppend
  ```

- 添加到当前`Machine`级别`$Env:Path`的开头：

  ``` powershell
  Add-PathToCurrentMachineEnvPath -Path 'C:\Program Files\Git\cmd' # Default is prepend
  ```

- 添加到当前`Machine`级别`$Env:Path`的末尾：

  ``` powershell
  Add-PathToCurrentMachineEnvPath -Path 'C:\Program Files\Git\cmd' -IsAppend
  ```

## 将某个路径从`$Env:Path`中删除

- 从当前`Process`级别的`$Env:Path`中删除：

  ``` powershell
  Remove-PathFromCurrentProcessEnvPath -Path 'C:\Program Files\Git\cmd'
  ```

- 从当前`User`级别的`$Env:Path`中删除：

  ``` powershell
  Remove-PathFromCurrentUserEnvPath -Path 'C:\Program Files\Git\cmd' 
  ```

- 从当前`Machine`级别的`$Env:Path`中删除：

  ``` powershell
  Remove-PathFromCurrentMachineEnvPath -Path 'C:\Program Files\Git\cmd'
  ```

{% note primary %}

上述命令会变量所有`$Env:Path`子项，当检测到子项值与给定的输入`$Path`一致时，对其进行删除操作。判断一致的逻辑与PowerShell字符串的[相等运算符](https://learn.microsoft.com/zh-cn/powershell/module/microsoft.powershell.core/about/about_comparison_operators?view=powershell-7.4#equality-operators)一致。

{% endnote %}

## 将匹配某个Pattern的路径从`$Env:Path`中删除

- 从当前`Process`级别的`$Env:Path`中删除：

  ``` powershell
  Remove-MatchedPathsFromCurrentProcessEnvPath -Pattern 'Git'
  ```

- 从当前`User`级别的`$Env:Path`中删除：

  ``` powershell
  Remove-MatchedPathsFromCurrentUserEnvPath -Pattern 'Git'
  ```

- 从当前`Machine`级别的`$Env:Path`中删除：

  ``` powershell
  Remove-MatchedPathsFromCurrentMachineEnvPath -Pattern 'Git'
  ```

{% note primary %}

上述命令会变量所有`$Env:Path`子项，当检测到子项值与给定的输入`$Pattern`匹配时，进行删除操作。判断匹配的逻辑与PowerShell字符串的[匹配运算符](https://learn.microsoft.com/zh-cn/powershell/module/microsoft.powershell.core/about/about_comparison_operators?view=powershell-7.4#matching-operators)一致。

{% endnote %}

# 总结与讨论

本文是PowerShell模组
[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)
的使用案例分享。可以更方便地帮助用户，在使用PowerShell时，管理
`$Env:Path`。上述的案例非常适合于使用PowerShell、同时使用[Miniconda](https://docs.anaconda.com/free/miniconda/),
[MSYS2](https://www.msys2.org/)
等带有**包管理器**，实现独立的**包管理模式** 的工具的场景。

- 缺点：需要安装PowerShell模组
- 优点：让用户从关心如何处理`$Env:Path`的过程中解放出来，只需要关心是否需要将某个路径加入到`$Env:Path`中。

# References

- [EnvironmentVariableTarget Enum (System) \| Microsoft
  Learn](https://learn.microsoft.com/zh-cn/dotnet/api/system.environmentvariabletarget?view=net-8.0)
