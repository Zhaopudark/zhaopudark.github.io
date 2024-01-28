---
abbrlink: 98626aad
categories: Personal Experiences
date: "2024-01-25 01:20:22"
tags:
- PowerShell
- Windows
- DDNS
title: 【PowerShell模组开发日志】Windows DDNS, 将本机IPv6推送到阿里云DNS
updated: "2024-01-25 12:56:41"
---

本文是PowerShell模组
[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)
的使用案例分享。记录了借助
[aliyun-cli](https://github.com/aliyun/aliyun-cli)
工具在Windows上配置DDNS，将本机IPv6推送到阿里云解析的过程。

<!-- more -->

# 基本概念与动机

> **DNS（Domain Name System）：** DNS
> 是域名系统的缩写，它是一种用于将易于记忆的域名（比如
> www.example.com）映射到计算机网络中的 IP 地址的系统。DNS
> 提供了一种分布式数据库，允许将域名转换为与之相关联的 IP
> 地址。通过使用域名而不是直接使用 IP
> 地址，用户可以更轻松地访问互联网上的资源。
>
> **DDNS（Dynamic Domain Name System）：** DDNS
> 是动态域名系统的缩写。与传统的静态 DNS 不同，DDNS 允许动态地更新域名与
> IP 地址之间的映射。这对于拥有动态 IP
> 地址的设备非常有用，例如家庭网络中的路由器。DDNS 允许设备在其 IP
> 地址更改时自动更新与其关联的域名，确保用户可以始终通过域名访问设备而不受
> IP 地址变化的影响。

在某些情况下，用户可能需要将本机的公网IP地址推送到域名解析服务商，以实现某些目的。有很多优秀的开源DDNS工具或服务，例如

- [NewFuture/DDNS](https://github.com/NewFuture/DDNS)
- [jeessy2/ddns-go](https://github.com/jeessy2/ddns-go)

但是大多依赖于高级的程序语言和对应的运行环境，如python，go等，不够轻量化。当然，也得益于此于此，这些工具可以支持更加灵活且多样性的功能。而本人的日常工作条件，有
`将本地IPv6推送到阿里云DNS` 需求，且使用的是 Windows
主机。希望有一个更加轻量化，更加直接的方法，对本地IPv6进行DDNS，且只需要推送到阿里云。因此，有了本文的方法与实践案例。

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

## 安装 aliyun-cli

``` powershell
winget search aliyun-cli
winget install --id Alibaba.AlibabaCloudCLI
```

## 配置 aliyun-cli

参考 [aliyun/aliyun-cli: Alibaba Cloud CLI
(github.com)](https://github.com/aliyun/aliyun-cli#configure)

建议首先建立RAM用户，并获取对应DNS资源的权限的`AccessKey ID` 和
`AccessKey Secret`。然后通过命令行依次进行配置即可。

``` powershell
aliyun configure
# Configuring profile 'default' ...
# Aliyun Access Key ID [None]: <Your AccessKey ID>
# Aliyun Access Key Secret [None]: <Your AccessKey Secret>
# Default Region Id [None]: cn-hangzhou
# Default output format [json]: json
# Default Language [zh]: zh
```

{% note warning%}

安全性警告：上述配置会在
[`${Home}/.aliyun/config.json`](https://github.com/aliyun/aliyun-cli/issues/63#issuecomment-391181479)
中明文保存密钥，且暂时没有找到官方支持的安全保存方法。因此，切勿在非安全环境下使用。

{% endnote %}

## 安装PowerShell模组PSComputerManagementZp

参考 [PowerShell Gallery \| PSComputerManagementZp
0.1.0](https://www.powershellgallery.com/packages/PSComputerManagementZp/0.1.0):

``` powershell
Install-Module -Name PSComputerManagementZp -Force
```

# 配置DDNS

以管理员权限运行PowerShell，再下面的流程中不要退出该shell窗口。

- 确保 aliyun-cli 在PowerShell中可用。

  ``` powershell
  aliyun --help
  ```

- 确保
  [PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)
  版本不低于0.0.5

  ``` powershell
  (Get-Module -Name PSComputerManagementZp).Version -ge [System.Version]::new("0.0.5")
  ```

- 查看本机IPv6信息。不同的网络提供商，会有不同的IPv6信息。这些信息将用于后面的正则匹配，以便于工具可以正确地实时获取我们需要推送的IPv6地址

  ``` powershell
  ipconfig
  # 以太网适配器 以太网:
  #    连接特定的 DNS 后缀 . . . . . . . :
  #    IPv6 地址 . . . . . . . . . . . . : <ipv6_1>
  #    IPv6 地址 . . . . . . . . . . . . : <ipv6_2>
  #    临时 IPv6 地址. . . . . . . . . . : <ipv6_3>
  #    本地链接 IPv6 地址. . . . . . . . : <ipv6_0>
  ```

- 以公网IPv6为 `240e:`开头，在本机的适配器名称为 `以太网适配器 以太网`
  为例，且假设推送到域名为`xxx.xxx`
  的域名解析，主机记录为`abc`，那么，可以有如下的命令：

  ``` powershell
  $commands = {
  Import-Module PSComputerManagementZp -Scope Local -Force
  $ipv6 = (Get-TemporaryIPV6ByPattern -AdapterPattern '以太网' -AdressPattern '^240e:')
  Add-OrUpdateDnsDomainRecord4Aliyun -DomainName 'xxx.xxx' -RecordName 'abc' -RecordType AAAA -RecordValue $ipv6
  Remove-Module PSComputerManagementZp
  }
  Register-PwshCommandsAsRepetedSchedulerTask -TaskName 'DDNS' -TaskPath 'PSComputerManagementZp' -LogonType S4U -Commands $commands -RepetitionInterval (New-TimeSpan -Minutes 5) -AtLogon -AtStartup

  Stop-ScheduledTask -TaskName "PSComputerManagementZp\DDNS" 
  Start-ScheduledTask -TaskName "PSComputerManagementZp\DDNS"
  ```

  - 其中，`$commands`
    将安装模组、获取对应pattern的IPv6、添加或者更新主机记录、移除模组这四个主要流程进行了打包。用户在自己的环境中使用时，根据上文描述进行修改即可。最终，`abc.xxx.xxx`
    将被解析为本机的IPv6地址。

    {% note primary%}

    `PSComputerManagementZp` 模组提供的 `Get-TemporaryIPV6ByPattern`
    函数会检测所有符合筛选条件的本机IPv6地址，形成列表，并优先给出最后一条记录。也就是说，一般情况下，优先给出临时IPv6。至于这个特性是否降低了风险，用户可以自己定夺。本文不作评价

    {% endnote %}

  - 然后，将`$commands`打包的命令继续借助`PSComputerManagementZp`
    模组提供的 `Register-PwshCommandsAsRepetedSchedulerTask`
    函数注册进了Windows任务计划程序库，触发条件为开机或者用户登录后，每隔五分钟，以最高权限运行。因此，实现了DDNS。

- 打开Windows计划程序检查配置是否完成。具体位置为
  `计算机管理->系统工具->任务计划程序->任务计划程序库->PSComputerManagementZp->DDNS`
  :

  <figure>
  <img
  src="https://raw.little-train.com/b85bef1e665fdfc90a3de5910d2333e8bae28a9761fc4a44099948fa7811cfa4.png"
  alt="Windows计划程序" />
  <figcaption aria-hidden="true">Windows计划程序</figcaption>
  </figure>

# 总结与讨论

本文是PowerShell模组
[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)
的使用案例分享。记录了借助
[aliyun-cli](https://github.com/aliyun/aliyun-cli)
工具在Windows上配置DDNS，将本机IPv6推送到阿里云解析的过程。本文的方法利弊分明

- 缺点：通用性差。
  - 只适用于Windows平台
  - 需要PowerShell更新到7.0以上
  - 需要安装aliyun-cli
  - 只适用于本机IPv6
- 优点：轻量，只需要
  - 更新 PowerShell
  - 安装 aliyun-cli
  - 安装 PSComputerManagementZp模组
  - 借助winget, 可以完全在命令行完成操作。

因此，本文的案例，对于刚好符合本文优点条件的用户，十分推荐使用；对于有自己独特需求的用户，除了移步别处，也十分欢迎来[此处](https://github.com/Zhaopudark/PSComputerManagementZp/issues)提出需求。作者本人会考虑是否进行模组上的支持与适配。

# References

- [About IPv6 DDNS for Aliyun on
  Windows](https://github.com/Zhaopudark/PSComputerManagementZp/blob/main/Examples/README.md#about-ipv6-ddns-for-aliyun-on-windows)
