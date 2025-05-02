---
abbrlink: e08b94fa
categories: Personal Experiences
date: "2024-07-04 23:39:40"
tags:
- Windows
title: Code snippets to configure Windows
updated: "2024-07-06 01:53:15"
---

This post records some useful code snippets derived from my Windows
configuration. These snippets are designed to achieve certain
targets/goals/purposes, such as `disable auto reboot after updates`,
`enable long paths`, etc.

<!-- more -->

# Disable auto reboot after updates

Refer to [Manage device restarts after updates - Windows Deployment \|
Microsoft
Learn](https://learn.microsoft.com/en-us/windows/deployment/update/waas-restart).

Manage windows device restarts after updates, make it:

- Automatically download and schedule installation of updates.
- Don’t reboot after an update installation if a user is logged on.

## 中文描述

管理Windows设备(系统)更新后的重启行为, 使其：

- 自动下载更新并按照指定的计划进行安装。
- 对于已登录的用户，将不会执行自动重新引导。

## Code snippet

<script src="https://gist.github.com/Zhaopudark/fb9e9acb42c47e6ed3f317ee53ae96c5.js"></script>

## verification

Then, the corresponding `Windows Update Policy` can be checked by
`Settings->Windows Update->Advanced options->Configured update policies`
as the following:

<figure>
<img
src="https://raw.little-train.com/f33a62f89edc6928ddf90107ebcf33a9dc2cf251d57037694915b1afb1918fee.png"
alt="check windows update settings" />
<figcaption aria-hidden="true">check windows update
settings</figcaption>
</figure>

# Enable long paths

Refer to [Maximum Path Length Limitation - Win32 apps \| Microsoft
Learn](https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation?tabs=registry).

Enable Long Path (Remove Maximum Path Length Limitation).

## 中文描述

启用长路径(取消最大路径长度限制)。

## Code snippet

<script src="https://gist.github.com/Zhaopudark/5ca0e3204ffb9ae1dd2b39bb841d7432.js"></script>

# Move some items in `USERPROFILE` out of `C:/` and link back

Move some items in `USERPROFILE` out of `C:/` and link back.

Purposes/Benefits: Make the critical information (user files,
configurations) remain valid even if the system fails.

{% note info %}

Moving and linking back the whole `USERFROFILE` is not recommended.
Because there are too many miscellaneous in `USERFROFILE` that are
generated automatically and without any useful user information. It is
no need to move and link back them, since if the system fails, they can
be generated again. So, the fine-grained operation on items within
`USERFROFILE` is better.

{% endnote %}

When conducting, it is better to merge existing contents and backup the
original contents. The function `Set-DirSymbolicLinkWithSync` and
`Set-FileSymbolicLinkWithSync` of PowerShell module
[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)
can deal with `merge` and `backup` automatically in a convenient way.

## 中文描述

将一些用户文件夹内容移出C盘并链接回原位。

## Code snippet

<script src="https://gist.github.com/Zhaopudark/ca220d9a82e0d319263b349ff7c14621.js"></script>

# Reset ACL

Refer to [Reset ACL/SDDL to deal with authorization problems in ReFS or
NTFS \| Little Train’s Blog
(little-train.com)](https://little-train.com/posts/ebaccba2.html).

Reset ACL/SDDL to deal with authorization problems in `ReFS` or `NTFS`.

## 中文描述

重置 ACL/SDDL 以解决文件系统 `ReFS` 或`NTFS`中的授权问题。

## Code snippet

<script src="https://gist.github.com/Zhaopudark/acb4c41e4878fbacd3cc6d4c44e77774.js"></script>
