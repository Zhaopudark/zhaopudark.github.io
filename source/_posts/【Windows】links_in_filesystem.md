---
abbrlink: e1329018
categories: Personal Experiences
date: "2023-10-25 16:22:37"
math: true
mathjax: true
tags:
- Windows
- File System
title: There may be no need to fully understand Junction, Hard Link and
  Symbolic Link in NTFS
updated: "2024-01-25 01:20:46"
---

In normal scenarios, the concepts and characteristics of `hard links`,
`junctions`, and `symbolic links` are intertwined. Only a few words
cannot tell them clearly. However, in terms of daily use, why must we
understand 100% of their differences and similarities? Sometimes, it is
enough to remember these three concepts’ main features and differences,
plus some experience.

From the perspective of an average Windows user, this article introduces
`hard links`, `junctions`, and `symbolic links` in Windows file system
(NTFS). And, through direct experiments or tests, this article gives out
some insights that are less than deep and broad understanding and record
some simple usage. In the end, this article shows the same tests and
conclusions on ReFS.

All codes can be found in
[TestWindowsLinkBehavior.ps1](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Examples/TestWindowsLinkBehavior.ps1),
which has been integrated as an example in
[Zhaopudark/PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp),
one of my customized PowerShell Modules.

<!-- more -->

# Definition

The NTFS file system supports three types of file links: hard links,
junctions, and symbolic links. [^1]

> - [Hard
>   links](https://learn.microsoft.com/en-us/windows/win32/fileio/hard-links-and-junctions#hard-links):
>   A *hard link* is the file-system representation of a file by which
>   more than one path references a single file in the same volume. To
>   create a hard link, use the
>   [CreateHardLinkA](https://learn.microsoft.com/en-us/windows/desktop/api/WinBase/nf-winbase-createhardlinka)
>   function. [^2]
> - [Junctions](https://learn.microsoft.com/en-us/windows/win32/fileio/hard-links-and-junctions#junctions):
>   A *junction* (also called a *soft link*) differs from a hard link in
>   that the storage objects it references are separate directories. A
>   junction can also link directories located on different local
>   volumes on the same computer. Otherwise, junctions operate
>   identically to hard links. Junctions are implemented through
>   [reparse
>   points](https://learn.microsoft.com/en-us/windows/win32/fileio/reparse-points).
>   [^3]
> - [Symbolic
>   Links](https://learn.microsoft.com/en-us/windows/win32/fileio/symbolic-links):
>   A symbolic link is a file-system object that points to another file
>   system object. The object being pointed to is called the target.
>   Symbolic links are transparent to users; the links appear as normal
>   files or directories, and can be acted upon by the user or
>   application in exactly the same manner. Symbolic links are designed
>   to aid in migration and application compatibility with UNIX
>   operating systems. Microsoft has implemented its symbolic links to
>   function just like UNIX links.[^4]

For more information about symbolic links, see [Create symbolic
links](https://learn.microsoft.com/en-us/windows/win32/fileio/creating-symbolic-links).

# Test to Reveal Differences and Similarities

To Identify the differences and similarities of [Hard
links](https://learn.microsoft.com/en-us/windows/win32/fileio/hard-links-and-junctions#hard-links),
[Junctions](https://learn.microsoft.com/en-us/windows/win32/fileio/hard-links-and-junctions#junctions),
and [Symbolic
Links](https://learn.microsoft.com/en-us/windows/win32/fileio/symbolic-links)
on Windows, I think, the best way is to test. Because:

- As normal users, not experts on Windows development, we may not know
  all the similarities and differences.
- As normal users, we try to identify the similarities and differences
  is to use rather than analyze the design philosophy and make
  improvements.
- As normal users, we can directly get the similarities and differences
  in the aspect of usage by testing on specific circumstances. That’s
  enough.

So, in this article, we may not know all the similarities and
differences of these links. We may only concern about some occasions.
And in the following sections, we will design some tests, do these tests
and report the results. Key points will also be includes in conclusion.

**NOTICE**: If one wants to know more, even all information about these
links’ differences and similarities, the following links may be help,
but in this article, we do not cover so much content.

- [软连接和硬链接区别 - matengfei - 博客园
  (cnblogs.com)](https://www.cnblogs.com/matengfei123/p/12824422.html#:~:text=软链接%20软链接（也叫符号链接），类似于windows系统中的快捷方式，与硬链接不同，软链接就是一个普通文件，只是数据块内容有点特殊，文件用户数据块中存放的内容是另一文件的路径名的指向，通过这个方式可以快速定位到软连接所指向的源文件实体。,软链接可对文件或目录创建。%20软链接作用：)
- [Junction vs Symbolic Links - Windows
  (ourtechroom.com)](https://ourtechroom.com/tech/junction-vs-symbolic-links/)
- [windows - “directory junction” vs “directory symbolic link”? - Super
  User](https://superuser.com/questions/343074/directory-junction-vs-directory-symbolic-link)
- [硬链接和交汇点 - Win32 apps \| Microsoft
  Learn](https://learn.microsoft.com/zh-cn/windows/win32/fileio/hard-links-and-junctions)
- [重分析点 - Win32 apps \| Microsoft
  Learn](https://learn.microsoft.com/zh-cn/windows/win32/fileio/reparse-points)
- [符号链接 - Win32 apps \| Microsoft
  Learn](https://learn.microsoft.com/zh-cn/windows/win32/fileio/symbolic-links)
- [关于Windows：NTFS连接点和符号链接之间有什么区别？ \| 码农家园
  (codenong.com)](https://www.codenong.com/9042542/)

In the following sections, we product some tests and report key results.

## Preparation

We mainly tests the above links in 3 aspects, i.e, the basic attributes,
the delete behavior and the
[Authorization](https://learn.microsoft.com/en-us/windows/win32/secauthz/authorization-portal)
behavior. Let’s elaborate some prerequisites:

- Prepare a native Window System and make an extra drive `D:`. We can
  achieve this by
  [Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/hyper-v-on-windows-server)
  with Window-11 Enterprise Evaluation (developer). Here is a example:

  <img src="https://raw.little-train.com/393a4bf6d54e55efa041b8ab181dcfa3b987712669d8960e9c814e0a02dd5de1.png" alt="Hyper-V-with-D" style="zoom:50%;"/>

- Provided that we have `${Home}="C:\Users\User"` a drive `D:\` with
  NTFS.

- Use `$guid = [guid]::NewGuid()` to get a GUID as the name of testing
  dir, see
  [here](https://learn.microsoft.com/en-us/windows/terminal/customize-settings/profile-advanced#unique-identifier)
  for more about GUIDs.

- `${Home}\${guid}` and `D:\${guid}` are the working space (testing
  directory)

- Generate the following items for testing:

  - `${Home}\${guid}\file_for_hardlink.txt`
  - `D:\${guid}\file_for_hardlink.txt`
  - `${Home}\${guid}\dir_for_local_junction`
  - `D:\${guid}\dir_for_local_junction`
  - `${Home}\${guid}\dir_for_non_local_junction`
  - `D:\${guid}\dir_for_non_local_junction`
  - `${Home}\${guid}\fire_for_local_symbiliclink.txt`
  - `D:\${guid}\fire_for_local_symbiliclink.txt`
  - `${Home}\${guid}\fire_for_non_local_symbiliclink.txt`
  - `D:\${guid}\fire_for_non_local_symbiliclink.txt`
  - `${Home}\${guid}\dir_for_local_symbiliclink`
  - `D:\${guid}\dir_for_local_symbiliclink`
  - `${Home}\${guid}\dir_for_non_local_symbiliclink`
  - `D:\${guid}\dir_for_non_local_symbiliclink`

- Codes:

  - **See function**
    [`New-AllItem`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Examples/TestWindowsLinkBehavior.ps1#L49C5-L101C6)
    for the codes.

Then, we can generate a 14-type of links as:

| Path $\rightarrow$                                                     | Toward                                                                         | Type                                    |
|------------------------------------------------------------------------|--------------------------------------------------------------------------------|-----------------------------------------|
| `${Home}\${guid}\hardlink`                                             | `${Home}\${guid}\file_for_hardlink.txt`                                        | `Hard Link`$\rightarrow$`File`          |
| `D:\${guid}\hardlink`                                                  | `D:\${guid}\file_for_hardlink.txt`                                             | `Hard Link`$\rightarrow$`File`          |
| `${Home}\${guid}\local_junction`                                       | `${Home}\${guid}\dir_for_local_junction`                                       | `Junction`$\rightarrow$`Directory`      |
| `D:\${guid}\local_junction`                                            | `D:\${guid}\dir_for_local_junction`                                            | `Junction`$\rightarrow$`Directory`      |
| <font color=#FF00 >`D:\${guid}\non_local_junction`</font>              | <font color=#0080>`${Home}\${guid}\dir_for_non_local_junction`</font>          | `Junction`$\rightarrow$`Directory`      |
| <font color=#0080>`${Home}\${guid}\non_local_junction`</font>          | <font color=#FF00 >`D:\${guid}\dir_for_non_local_junction`</font>              | `Junction`$\rightarrow$`Directory`      |
| `${Home}\${guid}\local_symbiliclink-txt`                               | `${Home}\${guid}\fire_for_local_symbiliclink.txt`                              | `Symbolic Link`$\rightarrow$`File`      |
| `D:\${guid}\local_symbiliclink-txt`                                    | `D:\${guid}\fire_for_local_symbiliclink.txt`                                   | `Symbolic Link`$\rightarrow$`File`      |
| <font color=#FF00 >`D:\${guid}\non_local_symbiliclink-txt`</font>      | <font color=#0080>`${Home}\${guid}\fire_for_non_local_symbiliclink.txt`</font> | `Symbolic Link`$\rightarrow$`File`      |
| <font color=#0080>`${Home}\${guid}\non_local_symbiliclink-txt` </font> | <font color=#FF00>`D:\${guid}\fire_for_non_local_symbiliclink.txt`</font>      | `Symbolic Link`$\rightarrow$`File`      |
| `${Home}\${guid}\local_symbiliclink`                                   | `${Home}\${guid}\dir_for_local_symbiliclink`                                   | `Symbolic Link`$\rightarrow$`Directory` |
| `D:\${guid}\local_symbiliclink`                                        | `D:\${guid}\dir_for_local_symbiliclink`                                        | `Symbolic Link`$\rightarrow$`Directory` |
| <font color=#FF00>`D:\${guid}\non_local_symbiliclink`</font>           | <font color=#0080>`${Home}\${guid}\dir_for_non_local_symbiliclink`</font>      | `Symbolic Link`$\rightarrow$`Directory` |
| <font color=#0080>`${Home}\${guid}\non_local_symbiliclink`</font>      | <font color=#FF00>`D:\${guid}\dir_for_non_local_symbiliclink`</font>           | `Symbolic Link`$\rightarrow$`Directory` |

That is to say, we will make the 14-type of links as the table above,
covering many types that we may encounter when using. Notice, the table
above shows the interrelationship between the non-local links in the two
directories in <font color=#FF00 >red</font> and
<font color=#0080 >green</font>, i.e., a link name contains `non_local`
in `${Home}\${guid}` will be linked to a corresponding directory or file
in `D:\${guid}`, and a link name contains `non_local` in `D:\${guid}`
will be linked to a corresponding directory or file in
`${Home}\${guid}`. Although this operation seems to be troublesome, it
is necessary for the rigor of following tests and conclusions, since
`junction` and `symbolic link` can be created across partitions.

## Results

By
[TestWindowsLinkBehavior.ps1](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Examples/TestWindowsLinkBehavior.ps1)
with [Pester](https://pester.dev/docs/quick-start), it is easy to
conduct tests and collect results.

### Test Basic Attributes

Targets:

- Compare item `Attributes`.
- Compare item `LinkType`.
- Compare item `LinkTarget`.

Codes:

- **See the block** [‘Context Test Basic
  Attributes’](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Examples/TestWindowsLinkBehavior.ps1#L114C5-L231C6)

Th results are collected in the following table, where `-` means null or
empty (`'' or $null` in PowerShell)

| Path                                                  | Attributes              | LinkType     | LinkTarget                                            |
|-------------------------------------------------------|-------------------------|--------------|-------------------------------------------------------|
| `${Home}\${guid}\file_for_hardlink.txt`               | Archive                 | HardLink     | \-                                                    |
| `${Home}\${guid}\hardlink`                            | Archive                 | HardLink     | \-                                                    |
| `D:\${guid}\file_for_hardlink.txt`                    | Archive                 | HardLink     | \-                                                    |
| `D:\${guid}\hardlink`                                 | Archive                 | HardLink     | \-                                                    |
| `${Home}\${guid}\dir_for_local_junction`              | Directory               | \-           | \-                                                    |
| `${Home}\${guid}\local_junction`                      | Directory, ReparsePoint | Junction     | `${Home}\${guid}\dir_for_local_junction`              |
| `D:\${guid}\dir_for_local_junction`                   | Directory               | \-           | \-                                                    |
| `D:\${guid}\local_junction`                           | Directory, ReparsePoint | Junction     | `D:\${guid}\dir_for_local_junction`                   |
| `${Home}\${guid}\dir_for_non_local_junction`          | Directory               | \-           | \-                                                    |
| `D:\${guid}\non_local_junction`                       | Directory, ReparsePoint | Junction     | `${Home}\${guid}\dir_for_non_local_junction`          |
| `D:\${guid}\dir_for_non_local_junction`               | Directory               | \-           | \-                                                    |
| `${Home}\${guid}\non_local_junction`                  | Directory, ReparsePoint | Junction     | `D:\${guid}\dir_for_non_local_junction`               |
| `${Home}\${guid}\fire_for_local_symbiliclink.txt`     | Archive                 | \-           | \-                                                    |
| `${Home}\${guid}\local_symbiliclink-txt`              | Archive, ReparsePoint   | SymbolicLink | `${Home}\${guid}\fire_for_local_symbiliclink.txt`     |
| `D:\${guid}\fire_for_local_symbiliclink.txt`          | Archive                 | \-           | \-                                                    |
| `D:\${guid}\local_symbiliclink-txt`                   | Archive, ReparsePoint   | SymbolicLink | `D:\${guid}\fire_for_local_symbiliclink.txt`          |
| `${Home}\${guid}\fire_for_non_local_symbiliclink.txt` | Archive                 | \-           | \-                                                    |
| `D:\${guid}\non_local_symbiliclink-txt`               | Archive, ReparsePoint   | SymbolicLink | `${Home}\${guid}\fire_for_non_local_symbiliclink.txt` |
| `D:\${guid}\fire_for_non_local_symbiliclink.txt`      | Archive                 | \-           | \-                                                    |
| `${Home}\${guid}\non_local_symbiliclink-txt`          | Archive, ReparsePoint   | SymbolicLink | `D:\${guid}\fire_for_non_local_symbiliclink.txt`      |
| `${Home}\${guid}\dir_for_local_symbiliclink`          | Directory               | \-           | \-                                                    |
| `${Home}\${guid}\local_symbiliclink`                  | Directory, ReparsePoint | SymbolicLink | `${Home}\${guid}\dir_for_local_symbiliclink`          |
| `D:\${guid}\dir_for_local_symbiliclink`               | Directory               | \-           | \-                                                    |
| `D:\${guid}\local_symbiliclink`                       | Directory, ReparsePoint | SymbolicLink | `D:\${guid}\dir_for_local_symbiliclink`               |
| `${Home}\${guid}\dir_for_non_local_symbiliclink`      | Directory               | \-           | \-                                                    |
| `D:\${guid}\non_local_symbiliclink`                   | Directory, ReparsePoint | SymbolicLink | `${Home}\${guid}\dir_for_non_local_symbiliclink`      |
| `D:\${guid}\dir_for_non_local_symbiliclink`           | Directory               | \-           | \-                                                    |
| `${Home}\${guid}\non_local_symbiliclink`              | Directory, ReparsePoint | SymbolicLink | `D:\${guid}\dir_for_non_local_symbiliclink`           |

### Test Deletion Behavior

Targets:

- If delete the link, check whether the source exists or not.
- If delete the source, check whether the link exists or is valid.

Main methods:

- Since the targets involve two operations that will affect each other,
  we should delete links to check target 1 and then repeat the
  preparation as [**Preparation**](#Preparation) to restore testing
  status, then delete the source to check the target 2.
- We may encounter invalid links, where the link itself exists, but the
  source cannot be accessed through them. Instead of defining the
  meaning of an invalid link in the standard terminology, we here assume
  that a link is invalid as long as it does not serve our purpose. So,
  for the following tests and comparisons, we deal with directories and
  files separately:
  - If a file, either a link or a source file, can be opened normally
    with `notepad.exe` instead of `New Open` or throwing errors, we
    consider this file valid.
  - If a directory, either a link or a source directory, we establish a
    `.txt` file in it and check if the `.txt` file can be opened
    normally with `notepad.exe` instead of `New Open` or throwing
    errors, we consider this directory valid.

Codes:

- For target 1, **see the block** [‘Test Deletion Behavior1 (delete
  link)’](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Examples/TestWindowsLinkBehavior.ps1#L232C5-L327C6)
- For target 2, **see the block** [‘Test Deletion Behavior2 (delete
  source\|target)’](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Examples/TestWindowsLinkBehavior.ps1#L328C5-L421C6)

Results for target 1: See the following table.

| Link $\rightarrow$                                                     | Source                                                                         | Check source after link deletion |
|------------------------------------------------------------------------|--------------------------------------------------------------------------------|----------------------------------|
| `${Home}\${guid}\hardlink`                                             | `${Home}\${guid}\file_for_hardlink.txt`                                        | `*1`                             |
| `D:\${guid}\hardlink`                                                  | `D:\${guid}\file_for_hardlink.txt`                                             | `*1`                             |
| `${Home}\${guid}\local_junction`                                       | `${Home}\${guid}\dir_for_local_junction`                                       | `*2`                             |
| `D:\${guid}\local_junction`                                            | `D:\${guid}\dir_for_local_junction`                                            | `*2`                             |
| <font color=#FF00 >`D:\${guid}\non_local_junction`</font>              | <font color=#0080>`${Home}\${guid}\dir_for_non_local_junction`</font>          | `*2`                             |
| <font color=#0080>`${Home}\${guid}\non_local_junction`</font>          | <font color=#FF00 >`D:\${guid}\dir_for_non_local_junction`</font>              | `*2`                             |
| `${Home}\${guid}\local_symbiliclink-txt`                               | `${Home}\${guid}\fire_for_local_symbiliclink.txt`                              | `*3`                             |
| `D:\${guid}\local_symbiliclink-txt`                                    | `D:\${guid}\fire_for_local_symbiliclink.txt`                                   | `*3`                             |
| <font color=#FF00 >`D:\${guid}\non_local_symbiliclink-txt`</font>      | <font color=#0080>`${Home}\${guid}\fire_for_non_local_symbiliclink.txt`</font> | `*3`                             |
| <font color=#0080>`${Home}\${guid}\non_local_symbiliclink-txt` </font> | <font color=#FF00>`D:\${guid}\fire_for_non_local_symbiliclink.txt`</font>      | `*3`                             |
| `${Home}\${guid}\local_symbiliclink`                                   | `${Home}\${guid}\dir_for_local_symbiliclink`                                   | `*2`                             |
| `D:\${guid}\local_symbiliclink`                                        | `D:\${guid}\dir_for_local_symbiliclink`                                        | `*2`                             |
| <font color=#FF00>`D:\${guid}\non_local_symbiliclink`</font>           | <font color=#0080>`${Home}\${guid}\dir_for_non_local_symbiliclink`</font>      | `*2`                             |
| <font color=#0080>`${Home}\${guid}\non_local_symbiliclink`</font>      | <font color=#FF00>`D:\${guid}\dir_for_non_local_symbiliclink`</font>           | `*2`                             |

- `*1`: Become a normal file from a hardlink after link deletion.
- `*2`: Maintain as a normal dir. The deletion of the link with
  `-Recurse` does not influence the source.
- `*3`: Maintain as a normal file.

Results for target 2: See the following table.

| Link $\rightarrow$                                                     | Source                                                                         | Check link after source deletion |
|------------------------------------------------------------------------|--------------------------------------------------------------------------------|----------------------------------|
| `${Home}\${guid}\hardlink`                                             | `${Home}\${guid}\file_for_hardlink.txt`                                        | `*1`                             |
| `D:\${guid}\hardlink`                                                  | `D:\${guid}\file_for_hardlink.txt`                                             | `*1`                             |
| `${Home}\${guid}\local_junction`                                       | `${Home}\${guid}\dir_for_local_junction`                                       | `*4`                             |
| `D:\${guid}\local_junction`                                            | `D:\${guid}\dir_for_local_junction`                                            | `*4`                             |
| <font color=#FF00 >`D:\${guid}\non_local_junction`</font>              | <font color=#0080>`${Home}\${guid}\dir_for_non_local_junction`</font>          | `*4`                             |
| <font color=#0080>`${Home}\${guid}\non_local_junction`</font>          | <font color=#FF00 >`D:\${guid}\dir_for_non_local_junction`</font>              | `*4`                             |
| `${Home}\${guid}\local_symbiliclink-txt`                               | `${Home}\${guid}\fire_for_local_symbiliclink.txt`                              | `*5`                             |
| `D:\${guid}\local_symbiliclink-txt`                                    | `D:\${guid}\fire_for_local_symbiliclink.txt`                                   | `*5`                             |
| <font color=#FF00 >`D:\${guid}\non_local_symbiliclink-txt`</font>      | <font color=#0080>`${Home}\${guid}\fire_for_non_local_symbiliclink.txt`</font> | `*5`                             |
| <font color=#0080>`${Home}\${guid}\non_local_symbiliclink-txt` </font> | <font color=#FF00>`D:\${guid}\fire_for_non_local_symbiliclink.txt`</font>      | `*5`                             |
| `${Home}\${guid}\local_symbiliclink`                                   | `${Home}\${guid}\dir_for_local_symbiliclink`                                   | `*6`                             |
| `D:\${guid}\local_symbiliclink`                                        | `D:\${guid}\dir_for_local_symbiliclink`                                        | `*6`                             |
| <font color=#FF00>`D:\${guid}\non_local_symbiliclink`</font>           | <font color=#0080>`${Home}\${guid}\dir_for_non_local_symbiliclink`</font>      | `*6`                             |
| <font color=#0080>`${Home}\${guid}\non_local_symbiliclink`</font>      | <font color=#FF00>`D:\${guid}\dir_for_non_local_symbiliclink`</font>           | `*6`                             |

- `*4`: Maintain as a junction but point to a deleted path.
- `*5`: Maintain as a symbolic link file but point to a deleted path.
- `*6`: Maintain as a symbolic link dir but point to a deleted path

### Test [Authorization](https://learn.microsoft.com/en-us/windows/win32/secauthz/authorization-portal) Behavior

Targets:

- Check if the
  [Authorization](https://learn.microsoft.com/en-us/windows/win32/secauthz/authorization-portal)
  information of a source and its link are forced to bind to be the
  same.

Main methods:

- Set (modify) the owner of a source, and make it effective
- Set (modify) a different owner of a link, and make it effective
- Check is the owners of the source and link are the same one.
- **Logical weaknesses**:
  - The ownership is a part of
    [Authorization](https://learn.microsoft.com/en-us/windows/win32/secauthz/authorization-portal)
    information.
  - We set a source and a link to different owners separately and they
    show the difference, which means the authorization information of
    the source and its link are not forced to bind to be the same.
  - But strictly, if we set a source and a link to different owners
    separately and they still show the same owner, which can only means
    the ownership of the source and its link are forced to bind to be
    the same, instead of the all authorization information.
  - However, there are too many authorization aspects, that we, normal
    users, are not usually encounter. So, in this article, we
    uncritically argue that inconsistent ownership information can
    deduce inconsistent authorization information.
  - So, if we set a source and a link to different owners separately and
    they still show the same owner, we consider the authorization
    information of the source and its link are forced to bind to be the
    same.
  - **But, this method is always an opportunistic approach with
    pragmatism and is not a perfect solution, even though it works.**

Codes:

- **See the block** [‘Test Authorization
  Behavior’](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Examples/TestWindowsLinkBehavior.ps1#L422C5-L447C6)

Results : See the following table.

| Link $\rightarrow$                                                     | Source                                                                         | Is authorization the same? |
|------------------------------------------------------------------------|--------------------------------------------------------------------------------|----------------------------|
| `${Home}\${guid}\hardlink`                                             | `${Home}\${guid}\file_for_hardlink.txt`                                        | True                       |
| `D:\${guid}\hardlink`                                                  | `D:\${guid}\file_for_hardlink.txt`                                             | True                       |
| `${Home}\${guid}\local_junction`                                       | `${Home}\${guid}\dir_for_local_junction`                                       | False                      |
| `D:\${guid}\local_junction`                                            | `D:\${guid}\dir_for_local_junction`                                            | False                      |
| <font color=#FF00 >`D:\${guid}\non_local_junction`</font>              | <font color=#0080>`${Home}\${guid}\dir_for_non_local_junction`</font>          | False                      |
| <font color=#0080>`${Home}\${guid}\non_local_junction`</font>          | <font color=#FF00 >`D:\${guid}\dir_for_non_local_junction`</font>              | False                      |
| `${Home}\${guid}\local_symbiliclink-txt`                               | `${Home}\${guid}\fire_for_local_symbiliclink.txt`                              | False                      |
| `D:\${guid}\local_symbiliclink-txt`                                    | `D:\${guid}\fire_for_local_symbiliclink.txt`                                   | False                      |
| <font color=#FF00 >`D:\${guid}\non_local_symbiliclink-txt`</font>      | <font color=#0080>`${Home}\${guid}\fire_for_non_local_symbiliclink.txt`</font> | False                      |
| <font color=#0080>`${Home}\${guid}\non_local_symbiliclink-txt` </font> | <font color=#FF00>`D:\${guid}\fire_for_non_local_symbiliclink.txt`</font>      | False                      |
| `${Home}\${guid}\local_symbiliclink`                                   | `${Home}\${guid}\dir_for_local_symbiliclink`                                   | False                      |
| `D:\${guid}\local_symbiliclink`                                        | `D:\${guid}\dir_for_local_symbiliclink`                                        | False                      |
| <font color=#FF00>`D:\${guid}\non_local_symbiliclink`</font>           | <font color=#0080>`${Home}\${guid}\dir_for_non_local_symbiliclink`</font>      | False                      |
| <font color=#0080>`${Home}\${guid}\non_local_symbiliclink`</font>      | <font color=#FF00>`D:\${guid}\dir_for_non_local_symbiliclink`</font>           | False                      |

## Conclusion

We can use common language and get some conclusions that can be easily
understood and applied by us for these links:

- When establish a `hardlink` for a file, the source and the link will
  all become `hardlinks` to a real file that hided and only managed by
  file system. So:
  - Removing any one of the source or the link will not remove the real
    file, unless removing all of them.
  - Changing the authorization information of any one of the source or
    the link will change the real file’s authorization information since
    both of them represent a whole of one or more data regions in the
    drive.
  - Consider a set of a file and its all `hardlink`s, and if the element
    total number of this set has been shrunk to `1`, the remaining item
    will become a normal file, instead of maintaining `hardlink`. So, to
    some extent, if we generate the `hardlink`s of a file, there are no
    distinct differences between the file and its `hardlink`s, i.e., the
    the file and its `hardlink`s tend to homogenize. The expression,
    “its `hardlink`s”, is inaccurate.
- Remove (even with `-Recurse`) `Junctions` or `Symbolic Links` will not
  influence the source.
- Remove (even not `-Recurse`) the source of`Junctions` or
  `Symbolic Links` will not influence the status of the link itself, but
  the `LinkTarget` in these status will be an invalid path.
- The links, only including `Junctions` or `Symbolic Links` but
  excluding `hardlink`, and their sources are treated as independent
  file system objects and can have different authorization information.
  Which may leads to potential security risks.

# If in ReFS ?

[ReFS](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview):
**Resilient File System**
(**ReFS**),\[[7\]](https://en.wikipedia.org/wiki/ReFS#cite_note-technetReFS1-7)
codenamed
“Protogon”,\[[8\]](https://en.wikipedia.org/wiki/ReFS#cite_note-zdnetrefsunveiled-8)
is a [Microsoft](https://en.wikipedia.org/wiki/Microsoft)
[proprietary](https://en.wikipedia.org/wiki/Proprietary_format) [file
system](https://en.wikipedia.org/wiki/File_system) introduced with
[Windows Server 2012](https://en.wikipedia.org/wiki/Windows_Server_2012)
with the intent of becoming the “next generation” [file
system](https://en.wikipedia.org/wiki/File_system) after
[NTFS](https://en.wikipedia.org/wiki/NTFS).[^5]

This article is mainly about links in NTFS. But when it comes to ReFS,
we have also made follow-up studies and tests.

Since `${Home}` is in `C:\Users`, and recently, as the system drive,
`C:\` cannot be formatted to ReFS easily, see
[here](https://www.ithome.com/0/564/934.htm), so we only formatted drive
`D:\`.

We repeat all the above testing operations and report key results:

- Preparation

  - Drive `D:\` is formatted to ReFS instead of NTFS. As the following:

  <img src="https://raw.little-train.com/0000bc01ce6a3cfabd268485b8be6ad7f37926d292832b30849ab509d062fe64.png" alt="Hyper-V-with-D-ReFS" style="zoom: 50%;"/>

- Test Basic Attributes

  - Same results to the [basic attributes test](#Test Basic Attributes)
    in NTFS

- Test Delete Behavior

  - Same results to the [delete behavior test](#Test Deletion Behavior)
    in NTFS

- Test
  [Authorization](https://learn.microsoft.com/en-us/windows/win32/secauthz/authorization-portal)
  Behavior

  - Same results to the [authorization behavior
    test](#Test [Authorization](https://learn.microsoft.com/en-us/windows/win32/secauthz/authorization-portal) Behavior)
    in NTFS

Therefore, through the extensive follow-up studies, the
[conclusions](#Conclusion) about links in this article on NTFS still
hold on
[ReFS](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview)

[^1]: (2023, March 5). Hard links and junctions. Learn. https://learn.microsoft.com/en-us/windows/win32/fileio/hard-links-and-junctions

[^2]: (2023, March 5). Hard links and junctions. Learn. https://learn.microsoft.com/en-us/windows/win32/fileio/hard-links-and-junctions

[^3]: (2023, March 5). Hard links and junctions. Learn. https://learn.microsoft.com/en-us/windows/win32/fileio/hard-links-and-junctions

[^4]: (2023, March 5). Symbolic Links. Learn. https://learn.microsoft.com/en-us/windows/win32/fileio/symbolic-links

[^5]: (2023, May 15). ReFS - Wikipedia. En. https://en.wikipedia.org/wiki/ReFS
