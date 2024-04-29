---
abbrlink: 2862656e
categories: Personal Experiences
date: "2024-02-25 20:45:53"
tags:
- PowerShell
- Windows
- SDDL
title: 【PowerShell模组开发日志】简单重置`SDDL`以解决ReFS或者NTFS中的授权问题
updated: "2024-02-28 11:25:35"
---

作为Windows用户，会经常涉及两个实现了[高级安全功能](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview#the-following-features-are-available-with-refs-and-ntfs)的文件系统，[ReFS](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview)和[NTFS](https://en.wikipedia.org/wiki/NTFS)，但也给普通用户带来了和授权有关的使用问题。例如，“重装系统后，新系统用户没有对旧系统用户文件/文件夹的授权”。更具体地，当用户重装了Windows系统，但是选择保留文件时，未格式化的磁盘上的旧系统用户文件夹，依旧保留着对旧用户的授权，而没有对新系统用户开放授权（即使以同一个微软账号登录，也会视为一个新的用户）。这就是一种用户侧感知到的授权问题。

一般地，新用户需要手动给与授权，以便于获取旧用户文件夹中的内容。如果这个过程可以以一定的标准自动执行，将极大地方便重装系统但是保留文件的用户。在实践中，我们发现，如果能够简单地重置目标对象的
**SDDL**，就可以在不甚了解[计算机安全](https://en.wikipedia.org/wiki/Computer_security)这个大议题的情况下，让和作者本人一样的纯小白用户也能理解并解决其遇到的授权问题。这就是本文的核心动机。后文将简单地介绍
**SDDL**，给出借助PowerShell模组
[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)，重置[ReFS](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview)和
[NTFS](https://en.wikipedia.org/wiki/NTFS)文件系统中条目的
**SDDL**的方式。

{% note warning %}

本文默认在[ReFS](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview)和[NTFS](https://en.wikipedia.org/wiki/NTFS)文件系统上进行分析和操作，对于不支持
**SDDL**
的文件系统，自然也不支持本文涉及的操作。同时，本文的内容仅适用于单用户登录的Windows计算机。对于多用户登录使用的Windows计算机，本文的操作会导致其他用户的授权信息遭到破坏，请慎用。

本文源自[英文版原文](https://little-train.com/posts/ebaccba2.html)。现以PowerShell模组开发的视角，进行一些修改、重组与调整，并以中文的形式重新给出，充分尊重[Windows官方文档](https://learn.microsoft.com/zh-cn/)的官方机器翻译的中文内容，只有非常不通顺时才做适当修改，以便于读者自行考证。

{% endnote %}

<!-- more -->

# 基本概念与动机

{% note success %}

[授权(Authorization)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/authorization-portal)
，在通俗意义上就是对计算机资源进行权限管理，允许某些访问主体和访问方式，阻断某些访问主体和访问方式。可能在互联网上，对于授权问题，出现更多的是[ACL](https://en.wikipedia.org/wiki/Access-control_list)这样的术语。但是，如果从[Windows官方文档](https://learn.microsoft.com/zh-cn/)的视角看待，[授权(Authorization)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/authorization-portal)
才是更加宽泛的概念。

{% endnote %}

本文更愿意以Windows的视角与话术，来浅谈一些授权问题，并给出一些解决方案。希望以一个不深刻但依旧能讲明白，不细致但是不至于偏颇的方式，搞清楚如下一些关键名词之间的关系，并以此为基础，给用户侧感知到的授权问题定性，以方便给出和陈述可行的解决方案：

> - Windows 上的[访问控制(Access
>   Control)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control)与[授权(Authorization)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/authorization-portal)：授权是个人有权使用系统及其上存储的数据。
>   授权通常由系统管理员设置，并由计算机根据某种形式的用户标识（如代码号或密码）进行验证。[^1]访问控制是指控制谁可以访问操作系统中的资源的安全功能。
>   应用程序调用访问控制函数来设置谁可以访问特定资源或控制对应用程序提供的资源的访问。[^2]
>   授权的实现包含了
>   [访问控制（授权）](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control),
>   [访问控制编辑器](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-editor),
>   [客户端/服务器访问控制](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/client-server-access-control),
>   [应用资源的访问控制](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-for-application-resources),
>   [强制性完整性控制](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/mandatory-integrity-control)
>   和[用户账户控制（授权）](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/user-account-control).
>
> - [访问控制模型(Access Control
>   Model)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-model):
>   访问控制模型使你能够控制进程访问
>   [安全对象](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/securable-objects)
>   或执行各种系统管理任务的能力。[^3]访问控制模型有两个基本部分：
>   [访问令牌](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-tokens)
>   和[安全描述符](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-descriptors)
>   [^4]
>
> - [安全对象](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/securable-objects):安全对象是可以具有[安全描述符](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-descriptors)的对象。[^5]
>
> - [访问令牌(Access
>   Tokens)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-tokens):
>   其中包含有关已登录用户的信息。
>   [^6][访问令牌](https://learn.microsoft.com/zh-cn/windows/desktop/SecGloss/a-gly)是描述进程或线程的安全上下文的对象。
>   令牌中的信息包括与进程或线程关联的用户帐户的标识和权限。
>   当用户登录时，系统会通过将用户密码与存储在安全数据库中的信息进行比较来验证用户的密码。
>   如果密码经过身份验证，系统会生成访问令牌。
>   代表此用户执行的每个进程都有此访问令牌的副本。[^7]
>
> - [安全描述符(Security
>   Descriptors)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-descriptors):
>   其中包含有关已登录用户的信息。[^8]
>   [安全描述符](https://learn.microsoft.com/zh-cn/windows/desktop/SecGloss/s-gly)包含与安全对象关联的安全信息。安全描述符可以包含以下安全信息：[^9]
>
>   - 所有者和主组的 [安全标识符(Security
>     identifiers)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-identifiers)
>     (SIDs)。[^10]
>   - 一个 [自由访问控制列表(Discretionary Access Control
>     List)(DACL)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-lists#:~:text=%E7%B1%BB%E5%9E%8B%E7%9A%84%20ACL%EF%BC%9A-,DACL,-%E5%92%8C%20SACL%E3%80%82)
>     ，指定允许或拒绝的特定用户或组的访问权限。[^11]
>   - 一个 [系统访问控制列表(System Access Control
>     List)(SACL)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-lists#:~:text=ACL%EF%BC%9ADACL%20%E5%92%8C-,SACL,-%E3%80%82)，指定为对象生成审核记录的访问尝试的类型。[^12]
>   - 一组控制位，用于限定安全描述符或其单个成员的含义。[^13]
>
> - [安全标识符(Security
>   identifiers)(SID)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-identifiers):
>   安全标识符是用于标识受托人的可变长度的唯一值。
>   每个帐户都有一个由机构（如 Windows 域控制器）颁发的唯一
>   SID，并存储在安全数据库中。
>   每次用户登录时，系统都会从数据库中检索该用户的
>   SID，并将其置于该用户的访问令牌中。 系统使用访问令牌中的 SID 在与
>   Windows 安全的所有后续交互中标识用户。 当 SID
>   已用作用户或组的唯一标识符时，它不能再次用于标识其他用户或组。[^14]
>
> - [访问控制列表(Access Control
>   Lists)(ACL)](https://en.wikipedia.org/wiki/Access-control_list):
>   在计算机安全领域，访问控制列表（ACL）是与系统资源（对象或设施）相关联的权限列表\[a\]。ACL
>   规定了哪些用户或系统进程可以访问资源，以及允许对给定资源进行哪些操作。[^15]在Windows系统中,
>   [访问控制列表(ACL)](https://learn.microsoft.com/zh-cn/windows/desktop/SecGloss/a-gly)
>   是[访问控制条目(ACE)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-entries)的列表。
>   ACL 中的每个 ACE
>   标识一个受信者，并指定该受信者允许、拒绝或审核的访问权限。
>   安全对象的安全描述符可以包含两种类型的
>   ACL：[自由访问控制列表(Discretionary Access Control
>   List)(DACL)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-lists#:~:text=%E7%B1%BB%E5%9E%8B%E7%9A%84%20ACL%EF%BC%9A-,DACL,-%E5%92%8C%20SACL%E3%80%82)和
>   [系统访问控制列表(System Access Control
>   List)(SACL)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-lists#:~:text=ACL%EF%BC%9ADACL%20%E5%92%8C-,SACL,-%E3%80%82)。[^16]
>   DACL 控制着对象的访问权限，决定了谁可以做什么。SACL
>   则用于安全审计，它记录了特定操作的尝试和结果，允许系统管理员审查安全事件。总的来说，DACL
>   用于控制访问权限，而 SACL 用于安全审计。这两个列表结合起来，提供了
>   Windows 系统中对象级安全性的基础。[^17]
>
> - [访问控制条目(Access Control
>   Entries)(ACE)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-entries):访问控制条目是[访问控制列表(ACL)](https://learn.microsoft.com/zh-cn/windows/desktop/SecGloss/a-gly)
>   中的一个元素， ACL 可以有零个或多个 ACE。 每个 ACE
>   控制或监视指定受信人对对象的访问。[^18]
>
> - [AccessCheck
>   的工作原理](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/how-dacls-control-access-to-an-object):
>   当线程尝试访问安全对象时，系统会授予或拒绝访问权限。如果对象没有自由访问控制列表(DACL)
>   ，则系统会授予访问权限；否则，系统会在对象的 DACL
>   中查找应用于线程的访问控制条目(ACE) 。 对象的 DACL中的每个ACE
>   指定受信人允许或拒绝的访问权限，这些权限可以是用户帐户、组帐户或登录会话。[^19]
>
>   - 当线程尝试使用安全对象时，系统会先执行访问检查，然后再允许线程继续。
>     在访问检查中，系统会将线程访问令牌中的安全信息与对象的安全描述符中的安全信息进行比较。系统会检查对象的
>     DACL，从线程的访问令牌中查找应用于用户和组 SID 的 ACE。
>     系统会检查每个 ACE，直到授予或拒绝访问权限，或者直到没有其他 ACE
>     要检查。 可想而知， (ACL) 的 访问控制列表 可能有多个适用于令牌 SID
>     的 ACE。 如果发生这种情况，则每个 ACE 授予的访问权限将累积。
>     例如，如果一个 ACE 授予对组的读取访问权限，另一个 ACE
>     向属于组成员的用户授予写入访问权限，则用户可以同时具有对对象的读取和写入访问权限。[^20]
>   - 如果 Windows 对象没有自由访问控制列表
>     (DACL)，系统就会允许所有人对其进行完全访问。如果对象有
>     DACL，系统只允许 DACL 中访问控制条目 (ACE) 明确允许的访问。如果
>     DACL 中没有 ACE，系统就不允许任何人访问。同样，如果 DACL 中的 ACE
>     允许有限的用户或组访问，系统就会隐式地拒绝 ACE
>     未包含的所有受托人访问。在大多数情况下，可以通过使用允许访问的 ACE
>     来控制对对象的访问；不需要明确拒绝对对象的访问。例外情况是，当 ACE
>     允许访问一个组，而你又想拒绝该组成员的访问时。为此，在 DACL
>     中将用户的拒绝访问 ACE 置于组的允许访问 ACE 之前。请注意，ACE
>     的顺序很重要，因为系统会按顺序读取
>     ACE，直到允许或拒绝访问为止。用户的拒绝访问 ACE
>     必须出现在前面；否则，当系统读取组的允许访问 ACE
>     时，就会授予受限用户访问权限。[^21]
>   - 如果属于对象的安全描述符的任意访问控制列表(DACL) 设置为
>     **NULL**，则会创建 **NULL DACL**。 **NULL
>     DACL**向请求它的任何用户授予完全访问权限;不对对象执行正常安全检查。
>     不应将**NULL DACL** 与 **空DACL** 混淆。 **空DACL**
>     是正确分配和初始化的 DACL，它不包含访问控制条目(ACE) 。 **空DACL**
>     不向其分配到的对象授予任何访问权限。[^22]
>
> - [安全描述符定义语言(Security Descriptor Definition
>   Language)(SDDL)](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-descriptor-definition-language):
>   安全描述符定义语言 (SDDL) 定义
>   [**ConvertSecurityDescriptorToStringSecurityDescriptor**](https://learn.microsoft.com/zh-cn/windows/desktop/api/Sddl/nf-sddl-convertsecuritydescriptortostringsecuritydescriptora)
>   和
>   [**ConvertStringSecurityDescriptorToSecurityDescriptor**](https://learn.microsoft.com/zh-cn/windows/desktop/api/Sddl/nf-sddl-convertstringsecuritydescriptortosecuritydescriptora)
>   函数用来将
>   [安全描述符](https://learn.microsoft.com/zh-cn/windows/desktop/SecGloss/s-gly)
>   描述为文本字符串的字符串格式。
>   该语言还定义字符串元素，用于描述安全描述符组件中的信息。[^23]
>   SDDL的格式是一个以 **null**
>   结尾的字符串，其中的标记分别表示安全描述符的四个主要部分：所有者
>   (O:)、主组 (G:)、DACL (D:) 和 SACL (S:)。\[^SDDL_Format\]
>
>   - O:型式为`owner_sid`
>
>     - 标识对象的所有者的 [SID
>       字符串](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/sid-strings)
>       。
>
>   - G:型式为`group_sid`
>
>   - 标识对象的主组的 SID 字符串。
>
>   - D:型式为`dacl_flags(string_ace1)(string_ace2)... (string_acen)`
>
>   - S:型式为`sacl_flags(string_ace1)(string_ace2)... (string_acen)`
>
>   - dacl_flags: 应用于 DACL 的安全描述符控件标志。
>     有关这些控件标志的说明，请参阅
>     [**SetSecurityDescriptorControl**](https://learn.microsoft.com/zh-cn/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorcontrol)
>     函数。 dacl_flags字符串可以是以下字符串的零个或多个串联。
>
>   - sacl_flags: 应用于 SACL 的安全描述符控件标志。
>     sacl_flags字符串使用与dacl_flags字符串相同的控制位字符串。
>
>   - string_ace: 描述安全描述符 DACL 或 SACL 中的 ACE 的字符串。 有关
>     ACE 字符串格式的说明，请参阅 [ACE
>     字符串](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/ace-strings)。
>     每个 ACE 字符串都用括号(())括起来。

有了上述的基本概念，我们可以按照如下方式，进行一个通俗化的理解：

- **访问控制** 是 **Windows授权** 的一个实现。
- **访问控制模型** 是 **访问控制**
  的实现方式、运行模式、基础。其控制的主体目标是
  **安全对象**。**访问控制模型** 分为 **访问令牌** 与 **安全描述符**。
- **安全描述符** 包含与 **安全对象** 关联的安全信息，具体包含了
  **安全标识符(SID)**、**访问控制列表(ACL)(DACL/SACL)**、**控制位**
- **安全描述符定义语言(SDDL)** 可以用于定义和修改安全描述符。给定和修改
  **安全描述符字符串**，就可以实现对安全描述符的给定和修改。

{% note info %}

为了方便陈述，下文将 **安全描述符字符串** 也简称为 **SDDL**，即 **SDDL**
在下文行文时，将同时指代 **安全描述符定义语言**/**安全描述符字符串**
而不加区分。

{% endnote %}

由此，再次考察本文开头提出的授权问题，即“重装系统后，新系统用户没有对旧系统用户文件/文件夹的授权”，并做如下的推断、决策与陈述：

- **访问控制**是指控制谁可以访问操作系统中的资源的安全功能。缺少对旧系统用户文件/文件夹的授权，就属于
  **访问控制** 的范畴。应当将旧系统用户文件/文件夹视为
  **安全对象**。其授权问题的根本，是其 **安全描述符** 中的
  **安全标识符(SID)**
  属于旧系统分配，与当前系统用户不匹配，因此当前访问授权被拒绝。若要解决该授权问题，我们几乎无法修改当前系统用户的SID，而只能选择修改安全对象的安全描述符，将其中的SID修改为当前用户SID即可。
- 在实践中发现，不仅仅是 **安全标识符(SID)**
  不匹配，会导致授权问题，还有可能和 **访问控制列表(ACL)(DACL/SACL)**
  有关。（因为用户在长期使用过程中，可能曾经对某些目录手动修改过权限）
- 因此，整体性地修改 **安全对象** 的SDDL值，才足以保证解决授权问题。
- 但是SDDL值拥有复杂的结构，涉及诸多细节，如果直接修改，我们似乎很难在零基础的情况下，纯计算机安全领域小白的情况下，去把握细节，不出错地实现修改目的。但是，这并不妨碍我们以用户视角，去实现自身需求。
  - 若可以提前知道某个 **安全对象** 的正确SDDL值，并对该 **安全对象**
    应用该值，就可以在不了解太多SDDL细节的情况下，解决授权问题。
  - 如何获取 **安全对象**
    的正确的SDDL值呢？以虚拟机等方式，构建一个原生新系统，创建同样类型的对象，那么该对象的值，就应当是最正确的值。这对于普通用户，有可操作性，门槛低，是一个可行的方案。
- 我们可以以用户视角，给常见场景下的若干类 **安全对象**
  进行分类（其实就是定义若干模式），记录好这些类别的对象的正确SDDL值。然后对需要修改的对象进行模式匹配，给同类别对象，设置对应的正确SDDL值，即可解决授权问题。这个过程，就陈述为“简单重置
  **SDDL** 以解决ReFS或者NTFS中的授权问题”

PowerShell模组
[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)
提供的
[Reset-Authorization](https://github.com/Zhaopudark/PSComputerManagementZp/blob/main/Module/Public/Manager.Authorization.ps1#L1C1-L102C2)函数就是基于上述思路，首先对若干安全对象进行了分类，记录了正确的SDDL值。当对目标对象调用函数时，尝试进行匹配，匹配成功，则会以正确的SDDL值，覆盖目标对象原先的SDDL。后文将给出具体使用案例。

{% note primary %}

[Reset-Authorization](https://github.com/Zhaopudark/PSComputerManagementZp/blob/main/Module/Public/Manager.Authorization.ps1#L1C1-L102C2)函数基本适用于日常使用场景。因为其基于[Get-PathType](https://github.com/Zhaopudark/PSComputerManagementZp/blob/main/Module/Private/Tools/Authorization.ps1#L132C1-L279C2)函数，已经提前对几乎所有普通用户会涉及的安全对象类型进行了考察、记录，并组织了对象匹配模式，当对象匹配时，重置其SDDL。

若对象模式不匹配，不会重置SDDL。这个做法有利于提升安全性。

[Reset-Authorization](https://github.com/Zhaopudark/PSComputerManagementZp/blob/main/Module/Public/Manager.Authorization.ps1#L1C1-L102C2)函数支持对目录的递归遍历，但是是以单线程的方式，速度很慢，且目前没有计划进行多线程加速方面的开发。因此，暂且先添加了进度条显示功能，以便于实时反馈给用户完成进度。

{% endnote %}

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

# 重置SDDL

以管理员权限运行PowerShell，再下面的流程中不要退出该shell窗口。

{% note primary %}

本文的方法集成在在PowerShell模组[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)
中，虽然无法对其进行CI/CD测试，但在本地已通过测试，可确保同时适用于[ReFS](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview)和[NTFS](https://en.wikipedia.org/wiki/NTFS)文件系统。

更宽泛意义上，驱动器中条目(文件或文件夹)的属性，也会影响用户的授权。[Reset-Authorization](https://github.com/Zhaopudark/PSComputerManagementZp/blob/main/Module/Public/Manager.Authorization.ps1#L1C1-L102C2)函数也会对对象的属性考察、记录、组织匹配模式和重置，以确保对象在用户可见的范围内，完全成为了预期的符合用户感知的授权状态。这是值得注意的副作用。

再次提醒，以下方法不适用于多用户登录的计算机，因为会有可能破坏其他用户的授权信息。

{% endnote %}

## 递归的重置NTFS或ReFS磁盘`X:/` 中所有内容的SDDL

假设用户已有一个NTFS或ReFS磁盘`X:/`,
那么，对其中所有内容，重置SDDL，可以执行如下代码：

``` powershell
#Requires -Version 7.0
#Requires -RunAsAdministrator
Reset-Authorization 'X:\' -Recurse
```

其运行效果如下：

<figure>
<img
src="https://raw.little-train.com/d8384747c72f974c741362cff3adbf3d59551fe32af274884ee731c4aa7797cb.png"
alt="递归的重置NTFS或ReFS磁盘X:/中所有内容的SDDL" />
<figcaption
aria-hidden="true">递归的重置NTFS或ReFS磁盘<code>X:/</code>中所有内容的SDDL</figcaption>
</figure>

等待完成即可。

{% note success %}

虽然[Reset-Authorization](https://github.com/Zhaopudark/PSComputerManagementZp/blob/main/Module/Public/Manager.Authorization.ps1#L1C1-L102C2)函数是单线程递归遍历目录的，但是用户可以多开PowerShell,手动对不同目录，不同磁盘，同时运行。

出现 `Access to ... 'System Volume Information' is denied`
是正常也是必然的现象。默认情况下，磁盘根目录的`System Volume Information`
就是受保护，不可见，无权访问的，对`Administrator` 也一样。

{% endnote %}

# 总结与讨论

本文是PowerShell模组
[PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp)
的使用案例分享。可以帮助用户，更方便地重置[ReFS](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview)和
[NTFS](https://en.wikipedia.org/wiki/NTFS)文件系统中条目的 **SDDL**。

- 优点：从用户视角出发，无需深入了解
  **SDDL**，只需要知道期望的、正确的、默认的 **SDDL**
  值，就能够实现重置，以解决长期使用过程中，遇到的授权问题。
- 缺点：单线程，运行速度慢。仅支持Windows平台。
- 副作用：会同时修改一些驱动器中条目(文件或文件夹)的属性，不一定满足所有用户的特殊需求。
- 风险：不推荐在多用户登录的计算机上使用，因为会有可能破坏其他用户的授权信息。

[^1]: avinashcraft. 2023. 《授权 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/authorization-portal.

[^2]: alvinashcraft. 2023. 《访问控制 (授权) - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control.

[^3]: alvinashcraft. 2023. 《访问控制模型 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-model.

[^4]: alvinashcraft. 2023. 《访问控制模型的各个部分 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-components.

[^5]: alvinashcraft. 2023. 《安全对象 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/securable-objects.

[^6]: alvinashcraft. 2023. 《访问控制模型的各个部分 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-components.

[^7]: alvinashcraft. 2023. 《访问令牌 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-tokens.

[^8]: alvinashcraft. 2023. 《访问控制模型的各个部分 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-components.

[^9]: alvinashcraft. 2023. 《安全描述符 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-descriptors.

[^10]: alvinashcraft. 2023. 《安全描述符 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-descriptors.

[^11]: alvinashcraft. 2023. 《安全描述符 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-descriptors.

[^12]: alvinashcraft. 2023. 《安全描述符 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-descriptors.

[^13]: alvinashcraft. 2023. 《安全描述符 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-descriptors.

[^14]: alvinashcraft. 2023. 《安全标识符 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-identifiers.

[^15]: 《Access-control list - Wikipedia》. 不详. 见于 2024年2月27日. https://en.wikipedia.org/wiki/Access-control_list.

[^16]: alvinashcraft. 2023. 《访问控制列表 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-lists.

[^17]: 《SACL与DACL概述》. 不详. ChatGPT. 见于 2024年2月27日. https://chat.openai.com.

[^18]: alvinashcraft. 2023. 《访问控制条目 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-entries.

[^19]: alvinashcraft. 2023. 《AccessCheck 的工作原理 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/how-dacls-control-access-to-an-object.

[^20]: alvinashcraft. 2023. 《线程和安全对象之间的交互 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/interaction-between-threads-and-securable-objects.

[^21]: alvinashcraft. 2023. 《ACL 和 ACE - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/dacls-and-aces.

[^22]: alvinashcraft. 2023. 《AccessCheck 的工作原理 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/how-dacls-control-access-to-an-object.

[^23]: alvinashcraft. 2023. 《安全描述符定义语言 - Win32 apps》. 2023年6月13日. https://learn.microsoft.com/zh-cn/windows/win32/secauthz/security-descriptor-definition-language.
