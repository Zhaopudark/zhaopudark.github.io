---
abbrlink: ebaccba2
categories: Personal Experiences
date: "2023-10-25 16:22:37"
tags:
- Windows
- File System
title: Reset ACL/SDDL to deal with authorization problems in ReFS or
  NTFS
updated: "2024-07-05 08:49:46"
---

This article records my procedures for dealing with authorization
problems in
[ReFS](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview)
or [NTFS](https://en.wikipedia.org/wiki/NTFS) with Windows system. In
this article, we do not talk about the relationship between
`Authorization` and `File System`. And we do not differentiate which
`File System` can support the corresponding operations and rules about
`Authorization`. That is, if we encounter authorization problems, we
almost can follow the actions in this article, since if a `File System`
does not support authorization operations, it may not bring us
authorization problems.

<!-- more -->

Some crucial codes can be found in
[Authorization.ps1](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Private/Tools/Authorization.ps1)
and
[Manager.Authorization.ps1](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Public/Manager.Authorization.ps1),
which have been integrated in
[Zhaopudark/PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp),
one of my customized PowerShell Modules. But for direct usage, you just
need to install this module and use its public API
[`Reset-Authorization`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Public/Manager.Authorization.ps1#L1C1-L102C2).

This article, as well as
[`Reset-Authorization`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Public/Manager.Authorization.ps1#L1C1-L102C2),
does have some [limitations](#Limitations), and the 2 key points of them
are:

- Do not distinguish between multiple users. You should be very careful
  when using
  [`Reset-Authorization`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Public/Manager.Authorization.ps1#L1C1-L102C2)
  when it works on other user’s items.
- Do not work on all types of items. Only works on some common types of
  items.

Please take care of these limitations to protect your data safety. The
following will give out details.

# Motivation

When we use an operating system to process some resources that existed
before this system, we may encounter some authorization problems.
Because these pre-existing resources may retain previous authorization
information, which will not necessarily be identified or managed
correctly by the new system as our expectation.

For example, consider re-installing a new Windows system, and
maintaining the files in a non-system drive. Then, we may find some of
our user files in a non-system drive may belong to an unknown account
because our user ID has changed, even though we log in to the new system
with the same account as before. This phenomenon may incur authorization
problems when later usage, such as [`Git`](https://git-scm.com/) will
report a warning that the current user is different from the before one
that established a local repository.

To deal with the above authorization problems, we can recover the
default authorization state for those resources. From the aspect of
technology, these are problems and solutions related to [Computer
security - Wikipedia](https://en.wikipedia.org/wiki/Computer_security),
which is a big, important, and complex topic that I am unable to fully
understand or elaborate on clearly. But from the experience aspect, I
share my operations about recovering some non-system files on my PC when
authorization problems occur. In this article, I post some elementary
explanations of the concepts and principles of the used operations.

Personal view: I’m tired of the complexity of the GUI of the Window
system. Even though GUI is usually considered a simple and easy-learning
method to use a computer, for `Automation`, the CLI is a better way. In
this article, almost all the operations are done through PowerShell.
This article is very suitable for those using and managing an individual
PC.

<!-- more -->

**WARNING:** For those who share a PC with others, you should take care
of the operations and ensure they only affect the resources that belong
to yourself, without influencing others’ items.

# Precedent Concepts and Analization:

> - [Authorization on
>   Windows](https://learn.microsoft.com/en-us/windows/win32/secauthz/authorization-portal):
>   Authorization is the right granted an individual to use the system
>   and the data stored on it. Authorization is typically set up by a
>   system administrator and verified by the computer based on some form
>   of user identification, such as a code number or password. Microsoft
>   authorization technologies include Authorization Manager and the
>   Authz API. [^1]
>
> - [Access Control (Authorization on
>   Windows)](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control):
>   Access control refers to security features that control who can
>   access resources in the operating system. Applications call access
>   control functions to set who can access specific resources or
>   control access to resources provided by the application.[^2]
>   Authorization includes [Access
>   Control](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control),
>   [Access Control
>   Editor](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-editor),
>   [Client/Server Access
>   Control](https://learn.microsoft.com/en-us/windows/win32/secauthz/client-server-access-control),
>   [Access Control for Application
>   Resources](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-for-application-resources),
>   [Mandatory Integrity
>   Control](https://learn.microsoft.com/en-us/windows/win32/secauthz/mandatory-integrity-control)
>   and [User Account
>   Control](https://learn.microsoft.com/en-us/windows/win32/secauthz/user-account-control).
>
> - [Access Control
>   Model](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-model):
>   The access control model enables you to control the ability of a
>   [*process*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/p-gly)
>   to access [securable
>   objects](https://learn.microsoft.com/en-us/windows/win32/secauthz/securable-objects)
>   or to perform various system administration tasks.[^3] There are two
>   basic parts of the access control model: [Access
>   tokens](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-tokens)
>   and [Security
>   descriptors](https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptors)
>   [^4]
>
> - [Access
>   tokens](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-tokens),
>   which contain information about a logged-on user. [^5]An [*access
>   token*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/a-gly)
>   is an object that describes the [*security
>   context*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/s-gly)
>   of a
>   [*process*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/p-gly)
>   or thread. The information in a token includes the identity and
>   privileges of the user account associated with the process or
>   thread. When a user logs on, the system verifies the user’s password
>   by comparing it with information stored in a security database. If
>   the password is
>   [*authenticated*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/a-gly),
>   the system produces an access token. Every process executed on
>   behalf of this user has a copy of this access token. [^6]
>
> - [Security
>   descriptors](https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptors),
>   which contain the security information that protects a [securable
>   object](https://learn.microsoft.com/en-us/windows/win32/secauthz/securable-objects).[^7]
>   A [*security
>   descriptor*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/s-gly)
>   contains the security information associated with a [securable
>   object](https://learn.microsoft.com/en-us/windows/win32/secauthz/securable-objects).
>   A security descriptor consists of a
>   [SECURITY_DESCRIPTOR](https://learn.microsoft.com/en-us/windows/desktop/api/Winnt/ns-winnt-security_descriptor)
>   structure and its associated security information. A security
>   descriptor can include the following security information:[^8]
>
>   - [Security
>     identifiers](https://learn.microsoft.com/en-us/windows/win32/secauthz/security-identifiers)
>     (SIDs) for the owner and primary group of an object.[^9]
>   - A
>     [DACL](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists)
>     that specifies the access rights allowed or denied to particular
>     users or groups.[^10]
>   - A
>     [SACL](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists)
>     that specifies the types of access attempts that generate audit
>     records for the object.[^11]
>   - A set of control bits that qualify the meaning of a security
>     descriptor or its individual members.[^12]
>
> - [Securable
>   objects](https://learn.microsoft.com/en-us/windows/win32/secauthz/securable-objects):
>   A securable object is an object that can have a [security
>   descriptor](https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptors).
>   All named Windows objects are securable. Some unnamed objects, such
>   as
>   [*process*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/p-gly)
>   and thread objects, can have security descriptors too. [^13]
>
> - [SID](https://learn.microsoft.com/en-us/windows/win32/secauthz/security-identifiers):
>   A [*security
>   identifier*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/s-gly)
>   (SID) is a unique value of variable length used to identify a
>   [trustee](https://learn.microsoft.com/en-us/windows/win32/secauthz/trustees).
>   Each account has a unique SID issued by an authority, such as a
>   Windows domain controller, and stored in a security database. Each
>   time a user logs on, the system retrieves the SID for that user from
>   the database and places it in the [*access
>   token*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/a-gly)
>   for that user. The system uses the SID in the access token to
>   identify the user in all subsequent interactions with Windows
>   security. When a SID has been used as the unique identifier for a
>   user or group, it cannot ever be used again to identify another user
>   or group.[^14]
>
> - [ACL](https://en.wikipedia.org/wiki/Access-control_list): In
>   [computer
>   security](https://en.wikipedia.org/wiki/Computer_security), an
>   access-control list (ACL) is a list of
>   [permissions](https://en.wikipedia.org/wiki/File-system_permissions)
>   associated with a [system
>   resource](https://en.wikipedia.org/wiki/System_resource) (object).
>   An ACL specifies which
>   [users](https://en.wikipedia.org/wiki/User_(computing)) or [system
>   processes](https://en.wikipedia.org/wiki/Process_(computing)) are
>   granted access to objects, as well as what operations are allowed on
>   given objects. Each entry in a typical ACL specifies a subject and
>   an operation. For instance, if a file object has an ACL that
>   contains (Alice: read,write; Bob: read), this would give Alice
>   permission to read and write the file and give Bob permission only
>   to read it.[^15]On Windows system, An ACL is a list of [access
>   control
>   entries](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-entries)
>   (ACE). Each ACE in an ACL identifies a
>   [trustee](https://learn.microsoft.com/en-us/windows/win32/secauthz/trustees)
>   and specifies the [access
>   rights](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-rights-and-access-masks)
>   allowed, denied, or audited for that trustee. The [security
>   descriptor](https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptors)
>   for a [securable
>   object](https://learn.microsoft.com/en-us/windows/win32/secauthz/securable-objects)
>   can contain two types of ACLs: a *DACL* and an *SACL*.[^16]
>
> - [ACE](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-entries):
>   An [*access control
>   entry*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/a-gly)
>   (ACE) is an element in an [*access control
>   list*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/a-gly)
>   (ACL). An ACL can have zero or more ACEs. Each ACE controls or
>   monitors access to an object by a specified trustee. [^17]
>
> - [DACL](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists):
>   A [discretionary access control
>   list](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/d-gly)
>   (DACL) identifies the trustees that are allowed or denied access to
>   a securable object. When a
>   [process](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/p-gly)
>   tries to access a securable object, the system checks the ACEs in
>   the object’s DACL to determine whether to grant access to it. If the
>   object doesn’t have a DACL, the system grants full access to
>   everyone. If the object’s DACL has no ACEs, the system denies all
>   attempts to access the object because the DACL doesn’t allow any
>   access rights. The system checks the ACEs in sequence until it finds
>   one or more ACEs that allow all the requested access rights, or
>   until any of the requested access rights are denied.[^18]
>
> - [SACL](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists):
>   A [system access control
>   list](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/s-gly)
>   (SACL) allows administrators to log attempts to access a secured
>   object. Each ACE specifies the types of access attempts by a
>   specified trustee that cause the system to generate a record in the
>   security event log. An ACE in an SACL can generate audit records
>   when an access attempt fails, when it succeeds, or both. [^19]
>
> - [Access
>   Check](https://learn.microsoft.com/en-us/windows/win32/secauthz/how-dacls-control-access-to-an-object):
>   When a thread tries to access a securable object, the system either
>   grants or denies access. If the object does not have a
>   [*discretionary access control
>   list*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/d-gly)
>   (DACL), the system grants access; otherwise, the system looks for
>   [Access Control
>   Entries](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-entries)
>   (ACEs) in the object’s DACL that apply to the thread. Each ACE in
>   the object’s DACL specifies the access rights allowed or denied for
>   a
>   [trustee](https://learn.microsoft.com/en-us/windows/win32/secauthz/trustees),
>   which can be a user account, a group account, or a [*logon
>   session*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/l-gly).[^20]
>
>   - When a thread attempts to use a [securable
>     object](https://learn.microsoft.com/en-us/windows/win32/secauthz/securable-objects),
>     the system performs an access check before allowing the thread to
>     proceed. In an access check, the system compares the security
>     information in the thread’s [*access
>     token*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/a-gly)
>     against the security information in the object’s [*security
>     descriptor*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/s-gly).
>     The system checks the object’s DACL, looking for ACEs that apply
>     to the user and group SIDs from the thread’s access token. The
>     system checks each ACE until access is either granted or denied or
>     until there are no more ACEs to check. Conceivably, an [*access
>     control
>     list*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/a-gly)
>     (ACL) could have several ACEs that apply to the token’s SIDs. And,
>     if this occurs, the access rights granted by each ACE
>     **accumulate**. For example, if one ACE grants read access to a
>     group and another ACE grants write access to a user who is a
>     member of the group, the user can have both read and write access
>     to the object.[^21]
>   - If a Windows object does not have a [*discretionary access control
>     list*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/d-gly)
>     (DACL), the system allows everyone full access to it. If an object
>     has a DACL, the system allows only the access that is explicitly
>     allowed by the [*access control
>     entries*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/a-gly)
>     (ACEs) in the DACL. If there are no ACEs in the DACL, the system
>     does not allow access to anyone. Similarly, if a DACL has ACEs
>     that allow access to a limited set of users or groups, the system
>     implicitly denies access to all trustees not included in the ACEs.
>     In most cases, you can control access to an object by using
>     access-allowed ACEs; you do not need to explicitly deny access to
>     an object. The exception is when an ACE allows access to a group
>     and you want to deny access to a member of the group. To do this,
>     place an access-denied ACE for the user in the DACL ahead of the
>     access-allowed ACE for the group. Note that the [**order of the
>     ACEs**](https://learn.microsoft.com/en-us/windows/win32/secauthz/order-of-aces-in-a-dacl)
>     is important because the system reads the ACEs in sequence until
>     access is granted or denied. The user’s access-denied ACE must
>     appear first; otherwise, when the system reads the group’s access
>     allowed ACE, it will grant access to the restricted user.[^22]
>   - If the [*discretionary access control
>     list*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/d-gly)
>     (DACL) that belongs to an object’s [*security
>     descriptor*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/s-gly)
>     is set to **NULL**, a null DACL is created. A null DACL grants
>     full access to any user that requests it; normal security checking
>     is not performed with respect to the object. A null DACL should
>     not be confused with an empty DACL. An empty DACL is a properly
>     allocated and initialized DACL that contains no [*access control
>     entries*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/a-gly)
>     (ACEs). An empty DACL grants no access to the object it is
>     assigned to.[^23]
>
> - [Security Descriptor Definition Language
>   (SDDL)](https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptor-definition-language):
>   The security descriptor definition language (SDDL) defines the
>   string format that the
>   [**ConvertSecurityDescriptorToStringSecurityDescriptor**](https://learn.microsoft.com/en-us/windows/desktop/api/Sddl/nf-sddl-convertsecuritydescriptortostringsecuritydescriptora)
>   and
>   [**ConvertStringSecurityDescriptorToSecurityDescriptor**](https://learn.microsoft.com/en-us/windows/desktop/api/Sddl/nf-sddl-convertstringsecuritydescriptortosecuritydescriptora)
>   functions use to describe a [*security
>   descriptor*](https://learn.microsoft.com/en-us/windows/desktop/SecGloss/s-gly)
>   as a text string. The language also defines string elements for
>   describing information in the components of a security
>   descriptor.[^24] The format is a **null**-terminated string with
>   tokens to indicate each of the four main components of a security
>   descriptor: owner`(O:)`, primary group`(G:)`, DACL`(D:)`, and
>   SACL`(S:)`.[^25]
>
>   - O:owner_sid
>
>     - A [SID
>       string](https://learn.microsoft.com/en-us/windows/win32/secauthz/sid-strings)
>       that identifies the object’s owner.
>
>   - G:group_sid
>
>     - A SID string that identifies the object’s primary group.
>
>   - D:dacl_flags(string_ace1)(string_ace2)… (string_acen)
>
>     - Security descriptor control flags that apply to the DACL. For a
>       description of these control flags, see the
>       [SetSecurityDescriptorControl](https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorcontrol)
>       function. The dacl_flags string can be a concatenation of zero
>       or more of the following strings.
>
>       | ontrol | Constant in Sddl.h | Meaning |
>       |:---|:---|:---|
>       | “P” | SDDL_PROTECTED | The SE_DACL_PROTECTED flag is set. |
>       | “AR” | SDDL_AUTO_INHERIT_REQ | The SE_DACL_AUTO_INHERIT_REQ flag is set. |
>       | “AI” | SDDL_AUTO_INHERITED | The SE_DACL_AUTO_INHERITED flag is set. |
>       | “NO_ACCESS_CONTROL” | SDDL_NULL_ACL | The ACL is null. **Windows Server 2008, Windows Vista and Windows Server 2003:** Not available. |
>
>   - S:sacl_flags(string_ace1)(string_ace2)… (string_acen)
>
>     - Security descriptor control flags that apply to the SACL. The
>       sacl_flags string uses the same control bit strings as the
>       dacl_flags string.
>     - string_ace: A string that describes an ACE in the security
>       descriptor’s DACL or SACL. For a description of the ACE string
>       format, see [ACE
>       strings](https://learn.microsoft.com/en-us/windows/win32/secauthz/ace-strings).
>       Each ACE string is enclosed in parentheses. The syntax is
>       `ace_type;ace_flags;rights;object_guid;inherit_object_guid;account_sid;(resource_attribute)`[^26]

In the following content, we will treat `SDDL` and `SDDL` string as the
same thing.

So, basing on the above concepts, on Windows, to solve authorization
problems mentioned in the first section, i.e., how to recover the
default authorization state of problem resources, is mainly about how to
realize `Access Control`. Generally, we cannot change our
`access tokens` when we have logged on. Hence the only way may be to
change the security descriptors of target resources to default state,
i.e., to change `SDDLs` of target files and directories to default
values. Here are some methods to realize the modification of `SDDLs`:

- [icacls](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/icacls)
  tool: Displays or modifies discretionary access control lists (DACLs)
  on specified files, and applies stored DACLs to files in specified
  directories.[^27]
- Indirect PowerShell command with `.NET` [ObjectSecurity Class
  (System.Security.AccessControl)](https://learn.microsoft.com/en-us/dotnet/api/system.security.accesscontrol.objectsecurity?view=net-7.0)
  - [Get-Acl (Microsoft.PowerShell.Security) - PowerShell \| Microsoft
    Learn](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/get-acl?view=powershell-7.3)
  - [Set-Acl (Microsoft.PowerShell.Security) - PowerShell \| Microsoft
    Learn](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/set-acl?view=powershell-7.3)
  - [GetOwner](https://learn.microsoft.com/en-us/dotnet/api/system.security.accesscontrol.objectsecurity.getowner?view=net-7.0)/[SetOwner](https://learn.microsoft.com/en-us/dotnet/api/system.security.accesscontrol.objectsecurity.setowner?view=net-7.0)
  - [GetGroup](https://learn.microsoft.com/en-us/dotnet/api/system.security.accesscontrol.objectsecurity.getgroup?view=net-7.0)/[SetGroup](https://learn.microsoft.com/en-us/dotnet/api/system.security.accesscontrol.objectsecurity.setgroup?view=net-7.0)
  - [ModifyAccessRule](https://learn.microsoft.com/en-us/dotnet/api/system.security.accesscontrol.objectsecurity.modifyaccessrule?view=net-7.0)
  - …
- Direct PowerShell command with `.NET` [ObjectSecurity Class
  (System.Security.AccessControl)](https://learn.microsoft.com/en-us/dotnet/api/system.security.accesscontrol.objectsecurity?view=net-7.0)
  - [GetSecurityDescriptorSddlForm](https://learn.microsoft.com/en-us/dotnet/api/system.security.accesscontrol.objectsecurity.getsecuritydescriptorsddlform?view=net-7.0)
  - [SetSecurityDescriptorSddlForm Method
    (System.Security.AccessControl)](https://learn.microsoft.com/en-us/dotnet/api/system.security.accesscontrol.objectsecurity.setsecuritydescriptorsddlform?view=net-7.0)
- Other APIs or languages, such as
  [C++](https://learn.microsoft.com/en-us/windows/win32/secauthz/using-authorization-in-c--),
  [VB](https://learn.microsoft.com/en-us/windows/win32/secauthz/using-authorization-in-script),
  [Java](https://learn.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-acl-java),
  [Python](https://learn.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-acl-python)
  and
  [JavScript](https://learn.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-acl-javascript).

# My Solution

In this article, my solution is the third one in the above methods,
i.e., “Direct PowerShell command with `.NET` object
`System.Security.AccessControl`”. since it may be the easiest and
simplest way. To realize it, we only need to know the default `SDDLs`
instead of learning specific items in the concept of `SDDLs`. With the
help of reverse engineering, we even do not need to know how `SDDLs` are
compatible with different type of items in our normal scenarios, but
just get a default system, build types of items, test, and get the
corresponding default `SDDLs` of them. For example, if we establish a
native and new Windows system and make a new file or directory in a
target location, the `SDDLs` of these created items will be the default
one we need.

Take the following steps:

- (Optional) Make sure the PC is not used by 2 or more than 2 people in
  `User` level. This is an important premise of this article. Why?

  - In the following definition about common types of items, we hold the
    view that any non-system drives (disks) are possessed by a same
    single user.
  - In the system drive, usually`C:` , we make use of `$Home` to
    differentiate users automatically. But when it comes to non-system
    drives (disks), there is no such mechanism.
  - In this article, we will check/modify any items in `$Home` and
    non-system drives (disks), which means we should totally control
    `$Home` and non-system drives.
  - If a PC has 2 or more than 2 people in `User` level, we cannot
    guarantee the items in non-system drives (disks) are all possessed
    by the current user.
  - We should not change any authorization information on the items
    possessed by others, even though we have access to change.

  **If there is actually more than 1 user, all items of other users
  should be manually and carefully isolated to some directories or
  drives that won’t be involved.**

- Define an item type list that contains some common types of items for
  reverse engineering.

  - It may be impossible to test all types of items since there are too
    many types of items and there are too many factors that influence
    items’ types, such as drive formats, [FileAttributes
    (System.IO)](https://learn.microsoft.com/zh-cn/dotnet/api/system.io.fileattributes?view=net-7.0)
    and special usages.
  - So, actually, we can only test on a limited number of types of items
    and get a limited number of default `SDDLs`.
  - But as long as we cover common types of items, the method in this
    article is also practiced. Because for us, common users, most of the
    user data are just within common types.

- Get these items’ default `SDDLs`.

- Reset these items’ default `SDDLs`.

  - If an item appears in the item type list, we forcedly modify its
    `SDDL` to default `SDDL`

  - If an item does not appear in the item type list, we skip it.

These steps has been integrated in a public API
[`Reset-Authorization`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Public/Manager.Authorization.ps1#L1C1-L102C2)
of PowerShell Module
[Zhaopudark/PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp).
For normal usage, if you want to reset items in drive `D:\`, you can
install the model and do as:

``` powershell
#Requires -Version 7.0
#Requires -RunAsAdministrator   
Import-Module PSComputerManagementZp -Scope Local -Force
Reset-Authorization 'D:\'
Remove-Module PSComputerManagementZp
```

For more details, you can check [Appendix](#Appendix) for 3 key points:

- How to define an item type list that contains some common types of
  items. See [A.2 Types of Items](#A.2 Types of Items)
- How to get these items’ default `SDDLs`. See [A.3 Get
  `SDDL`](#A.3 Get `SDDL`)
- How to reset these items’ `SDDLs` to default status. See [A.4 Reset
  `SDDL`](#A.4 Reset `SDDL`)

# Conclusion

In this article, we introduce some basic aspects of [Authorization on
Windows](https://learn.microsoft.com/en-us/windows/win32/secauthz/authorization-portal)
and give out a personal experience to reset authorization (ACL/SDDL) of
items in Windows file system
[ReFS](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview)
or [NTFS](https://en.wikipedia.org/wiki/NTFS). The simple usage of the
article is:

- In stall a PowerShell Module
  [Zhaopudark/PSComputerManagementZp](https://github.com/Zhaopudark/PSComputerManagementZp).
- Run a PowerShell with `Administrator` privilege.
- Use a public API
  [`Reset-Authorization`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Public/Manager.Authorization.ps1#L1C1-L102C2)
  of the installed module to reset target items’ authorizations.

## Advantages

In the article, we use the most direct method, which is also a way of
reverse engineering:

- Define some common types of items.
- Testing to get default `SDDLs` of these items.
- Apply `SDDLs` on these items to achieve the “Reset” purpose.

So, there is no need to fully understand all the things about
[Authorization on
Windows](https://learn.microsoft.com/en-us/windows/win32/secauthz/authorization-portal),
[ACL](https://en.wikipedia.org/wiki/Access-control_list), [Security
Descriptor Definition Language
(SDDL)](https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptor-definition-language)
and so on.

With the most introductory mastery of PowerShell and Windows
development, we can deal with normal authorization problems in our daily
usage.

That is to say, in this article, when encountering the big problem,
[Computer security -
Wikipedia](https://en.wikipedia.org/wiki/Computer_security), we use
indirect strategies and reverse engineering with the ideas of empiricism
and pragmatism to handle it while avoiding escalating it into a big
problem that we don’t need to fully wade through in our daily life.

## Limitations

What you make is what you lose:

- The method in this article only suggested single-user scenarios,
  unless one fully understands [Authorization on
  Windows](https://learn.microsoft.com/en-us/windows/win32/secauthz/authorization-portal)
  and knows how to do it. This method is not designed to be very
  suitable for multi-user scenarios
- But, if one knows how to do and understands much about authorization
  on Windows, this article would have less reference to him/her.
- The method in this article is suitable for only the [28 common types
  of items](#A.2 Types of Items). For those out of the defined items, we
  can do nothing. Such as:
  - Items in
    [FAT32](https://en.wikipedia.org/wiki/File_Allocation_Table#FAT32)
    file system. Because it does not support ACL.
  - Uncommon item types in [FileAttributes
    (System.IO)](https://learn.microsoft.com/zh-cn/dotnet/api/system.io.fileattributes?view=net-7.0).
  - Any items within `<drive_letter>:\$('$Recycle.Bin')` and
    `<drive_letter>:\System Volume Information`.
    - We have not yet known the relationship between the authorization
      information of an item in `Recycle Bin` and the one of this item
      before it has been deleted. And, if we can change (we have not
      tested whether we can do it) the authorization information of
      items in `Recycle Bin`, what specific authorization information
      they will have after restoring them from `Recycle Bin`? We have
      not known it.
    - And, for those items in
      `<drive_letter>:\System Volume Information`, we have almost no
      access to get into them and this may bring `errors`. We allow this
      error to occur without fixing it, because it will not affect other
      things, and it better reflects the importance of authorization
      issues.
    - So, we bypass any items in `<drive_letter>:\$('$Recycle.Bin')` and
      `<drive_letter>:\System Volume Information`. See the
      [`Reset-Authorization`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Public/Manager.Authorization.ps1#L1C1-L102C2)
      function.
    - This may become a bug so we put it as a limitation here to inform
      all readers.
  - …
- For more complex using cases, the reference value of this paper is
  greatly reduced.
- For a single directory, the
  [`Reset-Authorization`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Public/Manager.Authorization.ps1#L1C1-L102C2)
  function can only support single-threaded jobs. Even though it can
  show the progress bar, when the number of items is large, it is still
  quite long to process. So it is needed to hang up to run for a long
  time.

# Tips and References

- [访问控制列表 - Win32 apps \| Microsoft
  Learn](https://learn.microsoft.com/zh-cn/windows/win32/secauthz/access-control-lists)

- [使用文件、文件夹和注册表项 - PowerShell \| Microsoft
  Learn](https://learn.microsoft.com/zh-cn/powershell/scripting/samples/working-with-files-folders-and-registry-keys?view=powershell-7.2)

- [Generic Access Rights - Win32 apps \| Microsoft
  Learn](https://learn.microsoft.com/en-us/windows/win32/secauthz/generic-access-rights)

- [Get-LocalUser (Microsoft.PowerShell.LocalAccounts) - PowerShell \|
  Microsoft
  Learn](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.localaccounts/get-localuser?view=powershell-5.1)

- [PowerShell: Get/Set File Attributes
  (xahlee.info)](http://xahlee.info/powershell/powershell_attributes.html)

- [Properly checking if an item in a folder is a Directory or not in
  PowerShell
  (koskila.net)](https://www.koskila.net/properly-checking-if-an-item-in-a-folder-is-a-directory-or-not-in-powershell/#:~:text=Properly%20checking%20if%20an%20item%20in%20a%20folder,See%20all%20possible%20values%20for%20the%20flags%3A)

- [Use a PowerShell Cmdlet to Work with File Attributes - Scripting Blog
  (microsoft.com)](https://devblogs.microsoft.com/scripting/use-a-powershell-cmdlet-to-work-with-file-attributes/)

- [使用文件、文件夹和注册表项 - PowerShell \| Microsoft
  Learn](https://learn.microsoft.com/zh-cn/powershell/scripting/samples/working-with-files-folders-and-registry-keys?view=powershell-7.2)

- [Generic Access Rights - Win32 apps \| Microsoft
  Learn](https://learn.microsoft.com/en-us/windows/win32/secauthz/generic-access-rights)

- [Get-LocalUser (Microsoft.PowerShell.LocalAccounts) - PowerShell \|
  Microsoft
  Learn](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.localaccounts/get-localuser?view=powershell-5.1)

- [PowerShell: Get/Set File Attributes
  (xahlee.info)](http://xahlee.info/powershell/powershell_attributes.html)

- [Properly checking if an item in a folder is a Directory or not in
  PowerShell
  (koskila.net)](https://www.koskila.net/properly-checking-if-an-item-in-a-folder-is-a-directory-or-not-in-powershell/#:~:text=Properly%20checking%20if%20an%20item%20in%20a%20folder,See%20all%20possible%20values%20for%20the%20flags%3A)

- [Use a PowerShell Cmdlet to Work with File Attributes - Scripting Blog
  (microsoft.com)](https://devblogs.microsoft.com/scripting/use-a-powershell-cmdlet-to-work-with-file-attributes/)

# Appendix

Details about my solution.

## A.1 Generate types of paths

- First, we can make a native Window System and make an extra NTFS drive
  `D:` and ReFS drive `E:`. We can achieve this by
  [Hyper-V](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/hyper-v-on-windows-server)
  with Window-11 system. Here is a example:

  <img src="https://raw.little-train.com/05f6aa4a9d87e1f3af36f0f4453dfcf6a4c5a98ecd65871eaf60cea9f79f6744.png" alt="Hyper-V-with-D-NTFS-E-REFS" style="zoom:50%;"/>

  **NOTICE**: We suggest using a normal Microsoft Account to log in to
  this Windows system. Because:

  - When we log in with local account and check an items’ authorization
    information in `$Home` , we may find the following situation:

    <figure>
    <img
    src="https://raw.little-train.com/9c1a31c671d589f12754f393465956695d746b67176885b87922520a7d0fd161.png"
    alt="none-group" />
    <figcaption aria-hidden="true">none-group</figcaption>
    </figure>

    - The
      [SID](https://learn.microsoft.com/en-us/windows/win32/secauthz/security-identifiers)
      `S-1-5-21-2016497886-3056380776-146821725-1000` represents the
      current user.
    - The
      [SID](https://learn.microsoft.com/en-us/windows/win32/secauthz/security-identifiers)
      `S-1-5-21-2016497886-3056380776-146821725-513` represents `None`.

  - It may be too difficult to explain this phenomenon, but it must not
    the most common scenario.

  - In normal usage, the items created in `$Home` usually have the same
    `Owner` and `Group`, i.e., the current user, instead of `None` with
    an
    [SID](https://learn.microsoft.com/en-us/windows/win32/secauthz/security-identifiers),
    which cannot be associated to any known users or groups.

  - So, to simulate real usage scenarios, we have better login the
    system with a normal Microsoft Account at the
    beginning(initialization).

- Second, we should remove(delete) `Account Unkown` of `$Home` in
  advance. Because when we install the operating system or upgrade the
  operating system, some temporary accounts will be created. And these
  accounts are likely to leave traces in the file system since the file
  system itself can exist independently of the operating system.

- Thirdly, the directory `D:\$('$Recycle.Bin')` and
  `E:\$('$Recycle.Bin')` may not exist when drive `D:` and `E:` are
  initialing. We have better create a `D:\New Text Document.txt` and
  `E:\New Text Document.txt`, and then remove them to `Recycle Bin` in
  advance to ensure `D:\$('$Recycle.Bin')` and `E:\$('$Recycle.Bin')`
  initialized.

- Then, we can generate the path examples that do not need administrator
  privileges as:

  ``` powershell
  #Requires -Version 7.0

  # $guid = [guid]::NewGuid()
  $guid = "ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e"
  New-Item -Path "${Home}\${guid}"  -ItemType Directory | Out-Null
  New-Item -Path "D:\${guid}" -ItemType Directory | Out-Null
  New-Item -Path "E:\${guid}" -ItemType Directory | Out-Null


  # NonSystemDisk[NTFS]\Root   
  #   D:\                  
  # NonSystemDisk[RTFS]\Root   
  #   E:\                     
  # Home\Root 
  #   ${Home}\                                   
  # NonSystemDisk[NTFS]\System Volume Information
  #   D:\System Volume Information
  # NonSystemDisk[NTFS]\$Recycle.Bin      
  #   D:\$Recycle.Bin
  # NonSystemDisk[ReFS]\System Volume Information
  #   E:\System Volume Information
  # NonSystemDisk[ReFS]\$Recycle.Bin      
  #   E:\$Recycle.Bin


  # Home\Directory                               
  # NonSystemDisk[NTFS]\Directory
  # NonSystemDisk[ReFS]\Directory 
  New-Item -Path "${Home}\${guid}\test_dir" -ItemType Directory | Out-Null
  New-Item -Path "D:\${guid}\test_dir"  -ItemType Directory | Out-Null
  New-Item -Path "E:\${guid}\test_dir"  -ItemType Directory | Out-Null

  # Home\Junction  
  # NonSystemDisk[NTFS]\Junction 
  # NonSystemDisk[ReFS]\Junction
  New-Item -Path "${Home}\${guid}\test_dir_for_junction" -ItemType Directory | Out-Null
  New-Item -Path "D:\${guid}\test_dir_for_junction"  -ItemType Directory | Out-Null
  New-Item -Path "E:\${guid}\test_dir_for_junction"  -ItemType Directory | Out-Null
  New-Item -Path "${Home}\${guid}\junction" -ItemType Junction -Target "${Home}\${guid}\test_dir_for_junction" | Out-Null
  New-Item -Path "D:\${guid}\junction" -ItemType Junction -Target "D:\${guid}\test_dir_for_junction" | Out-Null
  New-Item -Path "E:\${guid}\junction" -ItemType Junction -Target "E:\${guid}\test_dir_for_junction" | Out-Null

  # Home\desktop.ini  
  # NonSystemDisk[NTFS]\desktop.ini  
  # NonSystemDisk[ReFS]\desktop.ini  
  Copy-Item -Path "${Home}\desktop\desktop.ini" -Destination "${Home}\${guid}\desktop.ini"
  Copy-Item -Path "${Home}\desktop\desktop.ini" -Destination "D:\${guid}\desktop.ini"
  Copy-Item -Path "${Home}\desktop\desktop.ini" -Destination "E:\${guid}\desktop.ini"


  # Home\File 
  # NonSystemDisk[NTFS]\File 
  # NonSystemDisk[ReFS]\File   
  New-Item -Path "${Home}\${guid}\test_file.txt" -ItemType File | Out-Null
  New-Item -Path "D:\${guid}\test_file.txt"  -ItemType File | Out-Null
  New-Item -Path "E:\${guid}\test_file.txt"  -ItemType File | Out-Null

  # Home\HardLink
  # NonSystemDisk[NTFS]\HardLink  
  # NonSystemDisk[ReFS]\HardLink   
  New-Item -Path "${Home}\${guid}\test_file_for_hardlink.txt" -ItemType File | Out-Null
  New-Item -Path "D:\${guid}\test_file_for_hardlink.txt"  -ItemType File | Out-Null
  New-Item -Path "E:\${guid}\test_file_for_hardlink.txt"  -ItemType File | Out-Null
  New-Item -Path "${Home}\${guid}\hardlink" -ItemType HardLink -Target "${Home}\${guid}\test_file_for_hardlink.txt" | Out-Null
  New-Item -Path "D:\${guid}\hardlink"-ItemType HardLink -Target "D:\${guid}\test_file_for_hardlink.txt" | Out-Null
  New-Item -Path "E:\${guid}\hardlink"-ItemType HardLink -Target "E:\${guid}\test_file_for_hardlink.txt" | Out-Null

  # prepare for symbolic link
  New-Item -Path "${Home}\${guid}\test_dir_for_symbolic_link" -ItemType Directory | Out-Null
  New-Item -Path "D:\${guid}\test_dir_for_symbolic_link"  -ItemType Directory | Out-Null
  New-Item -Path "E:\${guid}\test_dir_for_symbolic_link"  -ItemType Directory | Out-Null
  New-Item -Path "${Home}\${guid}\test_file_for_symbolic_link.txt" -ItemType File | Out-Null
  New-Item -Path "D:\${guid}\test_file_for_symbolic_link.txt"  -ItemType File | Out-Null
  New-Item -Path "E:\${guid}\test_file_for_symbolic_link.txt"  -ItemType File | Out-Null     
  ```

- Then, we can generate the path examples that need administrator
  privileges as:

  ``` powershell
  #Requires -Version 5.0
  #Requires -RunAsAdministrator

  # $guid = [guid]::NewGuid()
  $guid = "ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e"
  New-Item -Path "${Home}\${guid}"  -ItemType Directory | Out-Null
  New-Item -Path "D:\${guid}" -ItemType Directory | Out-Null
  New-Item -Path "E:\${guid}" -ItemType Directory | Out-Null

  # Home\SymbolicLinkDirectory 
  New-Item -Path "${Home}\${guid}\symbolic_link" -ItemType SymbolicLink -Target "${Home}\${guid}\test_dir_for_symbolic_link" | Out-Null
  # NonSystemDisk[NTFS]\SymbolicLinkDirectory
  New-Item -Path "D:\${guid}\symbolic_link" -ItemType SymbolicLink -Target "D:\${guid}\test_dir_for_symbolic_link" | Out-Null                 
  # NonSystemDisk[ReFS]\SymbolicLinkDirectory
  New-Item -Path "E:\${guid}\symbolic_link" -ItemType SymbolicLink -Target "E:\${guid}\test_dir_for_symbolic_link" | Out-Null       
  # Home\SymbolicLinkFile 
  New-Item -Path "${Home}\${guid}\symbolic_link_txt" -ItemType SymbolicLink -Target "${Home}\${guid}\test_file_for_symbolic_link.txt" | Out-Null                        
  # NonSystemDisk[NTFS]\SymbolicLinkFile
  New-Item -Path "D:\${guid}\symbolic_link_txt" -ItemType SymbolicLink -Target "D:\${guid}\test_file_for_symbolic_link.txt" | Out-Null          
  # NonSystemDisk[ReFS]\SymbolicLinkFile
  New-Item -Path "E:\${guid}\symbolic_link_txt" -ItemType SymbolicLink -Target "E:\${guid}\test_file_for_symbolic_link.txt" | Out-Null       
  ```

- At last, we get the following 28 specific paths.

  | Types Description | Specific Path Example |
  |----|----|
  | `NonSystemDisk[NTFS]\Root` | `D:\` |
  | `NonSystemDisk[ReFS]\Root` | `E:\` |
  | `Home\Root` | `${Home}` |
  | `NonSystemDisk[NTFS]\System Volume Information` | `D:\System Volume Information` |
  | `NonSystemDisk[NTFS]\$Recycle.Bin` | `D:\$('$Recycle.Bin')` |
  | `NonSystemDisk[ReFS]\System Volume Information` | `E:\System Volume Information` |
  | `NonSystemDisk[ReFS]\$Recycle.Bin` | `E:\$('$Recycle.Bin')` |
  | `Home\Directory` | `${Home}\${guid}\test_dir` |
  | `Home\SymbolicLinkDirectory` | `${Home}\${guid}\symbolic_link` |
  | `Home\Junction` | `${Home}\${guid}\junction` |
  | `NonSystemDisk[NTFS]\Directory` | `D:\${guid}\test_dir` |
  | `NonSystemDisk[NTFS]\SymbolicLinkDirectory` | `D:\${guid}\symbolic_link` |
  | `NonSystemDisk[NTFS]\Junction` | `D:\${guid}\junction` |
  | `NonSystemDisk[ReFS]\Directory` | `E:\${guid}\test_dir` |
  | `NonSystemDisk[ReFS]\SymbolicLinkDirectory` | `E:\${guid}\symbolic_link` |
  | `NonSystemDisk[ReFS]\Junction` | `E:\${guid}\junction` |
  | `Home\desktop.ini` | `${Home}\${guid}\desktop.ini` |
  | `Home\SymbolicLinkFile` | `${Home}\${guid}\symbolic_link_txt` |
  | `Home\File` | `${Home}\${guid}\test_file.txt` |
  | `Home\HardLink` | `${Home}\${guid}\hardlink` |
  | `NonSystemDisk[NTFS]\desktop.ini` | `D:\${guid}\desktop.ini` |
  | `NonSystemDisk[NTFS]\SymbolicLinkFile` | `D:\${guid}\symbolic_link_txt` |
  | `NonSystemDisk[NTFS]\File` | `D:\${guid}\test_file.txt` |
  | `NonSystemDisk[NTFS]\HardLink` | `D:\${guid}\hardlink` |
  | `NonSystemDisk[ReFS]\desktop.ini` | `E:\${guid}\desktop.ini` |
  | `NonSystemDisk[ReFS]\SymbolicLinkFile` | `E:\${guid}\symbolic_link_txt` |
  | `NonSystemDisk[ReFS]\File` | `E:\${guid}\test_file.txt` |
  | `NonSystemDisk[ReFS]\HardLink` | `E:\${guid}\hardlink` |

## A.2 Types of Items

The PowerShell command `[enum]::GetValues([System.IO.FileAttributes])`
can help us to know the [FileAttributes
(System.IO)](https://learn.microsoft.com/zh-cn/dotnet/api/system.io.fileattributes?view=net-7.0).
There are 16 types of file attributes, i.e., `ReadOnly`, `Hidden`,
`System`, `Directory`, `Archive`, `Device`, `Normal`, `Temporary`,
`SparseFile`, `ReparsePoint`, `Compressed`, `Offline`,
`NotContentIndexed`, `Encrypted`, `IntegrityStream`, `NoScrubData`. But
from my experience, these attributes usually appear in combination not
individually except `Archive`. There are only 5 attribute combinations
we may encounter often in normal usage:

| Attributes | Path Example |
|----|----|
| Hidden, System, Directory | `D:\` or `D:\System Volume Information\` or `D:\$Recycle.Bin\` |
| Directory, ReparsePoint | `D:\*some_symbolic_link_dir\` or `D:\*some_junction\` |
| Hidden, System, Archive | `D:\*desktop.ini` |
| Archive, ReparsePoint | `D:\*some_symbolic_link_file` |
| Archive | `D:\*some_hardlink` |

And, a file system may also influence items’ `SDDLs` in a certain way.
In this article, we only concern about those items that hold in
[NTFS](https://learn.microsoft.com/zh-cn/windows-server/storage/file-server/ntfs-overview)
and
[ReFS](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview)
since these 2 file systems are the most common two.

Therefore, here we define 28 common types of files, links or directories
as following (consider `D:\`’s format is NTFS while `E:\`’s format is
ReFS while):

| Types Description | Path Example |
|----|----|
| `NonSystemDisk[NTFS]\Root` | `D:\` |
| `NonSystemDisk[RTFS]\Root` | `E:\` |
| `Home\Root` | `$Home\` |
| `NonSystemDisk[NTFS]\System Volume Information` | `D:\System Volume Information` |
| `NonSystemDisk[NTFS]\$Recycle.Bin` | `D:\$Recycle.Bin` |
| `NonSystemDisk[ReFS]\System Volume Information` | `E:\System Volume Information` |
| `NonSystemDisk[ReFS]\$Recycle.Bin` | `E:\$Recycle.Bin` |
| `Home\Directory` | `$Home\*some_nomrmal_dir\` |
| `Home\SymbolicLinkDirectory` | `$Home\*some_symbolic_link_dir\` |
| `Home\Junction` | `$Home\*some_junction\` |
| `NonSystemDisk[NTFS]\Directory` | `D:\*some_nomrmal_dir\` |
| `NonSystemDisk[NTFS]\SymbolicLinkDirectory` | `D:\*some_symbolic_link_dir\` |
| `NonSystemDisk[NTFS]\Junction` | `D:\*some_junction\` |
| `NonSystemDisk[ReFS]\Directory` | `E:\*some_nomrmal_dir\` |
| `NonSystemDisk[ReFS]\SymbolicLinkDirectory` | `E:\*some_symbolic_link_dir\` |
| `NonSystemDisk[ReFS]\Junction` | `E:\*some_junction\` |
| `Home\desktop.ini` | `$Home\*desktop.ini` |
| `Home\SymbolicLinkFile` | `$Home\*some_symbolic_link_file` |
| `Home\File` | `$Home\*some_normal_file or InHome\*some_sparse_file` |
| `Home\HardLink` | `$Home\*some_hardlink` |
| `NonSystemDisk[NTFS]\desktop.ini` | `D:\*desktop.ini` |
| `NonSystemDisk[NTFS]\SymbolicLinkFile` | `D:\*some_symbolic_link_file` |
| `NonSystemDisk[NTFS]\File` | `D:\*some_normal_file or D:\*some_sparse_file` |
| `NonSystemDisk[NTFS]\HardLink` | `D:\*some_hardlink` |
| `NonSystemDisk[ReFS]\desktop.ini` | `D:\*desktop.ini` |
| `NonSystemDisk[ReFS]\SymbolicLinkFile` | `D:\*some_symbolic_link_file` |
| `NonSystemDisk[ReFS]\File` | `D:\*some_normal_file or D:\*some_sparse_file` |
| `NonSystemDisk[ReFS]\HardLink` | `D:\*some_hardlink` |

**But, why the above 28 types are the common ones ？** I think the
reasons are (on Windows):

- Even though Personal Computers (PC) and Operating Systems (OS) can
  support multiple users. But in our daily lives, the PC is more about
  its personalization. So, `$Home` and non-system drives (disks) are the
  main region at user’s active disposal. There is a point of view that
  after a normal user logging in, most files or directories that are
  generated in the user folder or non-system drive should belong to this
  user.
- Programs will not be installed outside of `C:\` without the permission
  of users.
- The files of users, are mainly in the form of archives.
- For better usage of our files, we use links, i.e., [Hard
  links](https://learn.microsoft.com/en-us/windows/win32/fileio/hard-links-and-junctions#hard-links),
  [Junctions](https://learn.microsoft.com/en-us/windows/win32/fileio/hard-links-and-junctions#junctions),
  and [Symbolic
  Links](https://learn.microsoft.com/en-us/windows/win32/fileio/symbolic-links).
- For better control of the appearance, we use `desktop.ini`.

**NOTICE:** These types are classified from the user’s usage, and it is
not necessary to guarantee that their `SDDLs` are mutually exclusive.
For safety, the types out of the above 28 ones are not mentioned,
changed, modified, or influenced.

**See** [appendix A.1](#A.1 Generate types of paths) to generate the
above 28 path examples.

**See function**
[`Get-PathType`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Private/Tools/Authorization.ps1#L132)
for the codes to identify the above 28 types.

## A.3 Get `SDDL`

Consider we have the
[`Get-PathType`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Private/Tools/Authorization.ps1#L132)
function already, we can use the following `Get-Sddl`function to get a
`SDDL` as:

``` powershell
#Requires -Version 7.0
#Requires -RunAsAdministrator
function local:Get-Sddl([string]$Path){
    Set-Acl -Path $Path (Get-Acl $Path) # normalization
    Write-Output $Path
    Write-Output "PathType: $(Get-PathType $Path)"
    Write-Output (Get-Acl $Path).Sddl
}
```

**NOTICE**: The line `Set-Acl -Path $Path (Get-Acl $Path)` in `Get-Sddl`
function is needed. Because a path’s `SDDL` may have a not initialized
state, which is not the same as the one set by
`Set-Acl -Path $Path (Get-Acl $Path)`, even though this command seems to
do nothing:

- Objectively speaking, it’s just a certain mechanism or a certain
  characteristic.
- But, in this article, we actually use PowerShell commands `Get-Acl`
  and `Set-Acl` with `.NET` [ObjectSecurity Class
  (System.Security.AccessControl)](https://learn.microsoft.com/en-us/dotnet/api/system.security.accesscontrol.objectsecurity?view=net-7.0)
  to deal with authorization problems.
- If a path’s `SDDL` has different states before and after using
  `Set-Acl -Path $Path (Get-Acl $Path)`, it means its initial state is
  not our target in this article, even though this state can still be
  explained as a default one on a broader level.
- So, in this article, we consider `Set-Acl -Path $Path (Get-Acl $Path)`
  as a kind of initialization.

Therefore, we take the `SDDL` of a path as a default one, if:

- The path is a native path that is created by the current user, where
  the creation is a broad concept that any items that appear by the
  current user operations or commands can be considered as a created
  one.
- The path has been initialized by `Set-Acl -Path $Path (Get-Acl $Path)`
- The path is without any other modification except the above
  operations.

Then, we get the `SDDLs` of the 28 specific path examples in [appendix
A.1](#A.1 Generate types of paths) as:

``` powershell
Get-Sddl "D:\" 
Get-Sddl "E:\"    
Get-Sddl "${Home}"                          
Get-Sddl "D:\System Volume Information"     
Get-Sddl "D:\$('$Recycle.Bin')" 
Get-Sddl "E:\System Volume Information"     
Get-Sddl "E:\$('$Recycle.Bin')"   
Get-Sddl "${Home}\${guid}\test_dir"         
Get-Sddl "${Home}\${guid}\symbolic_link"    
Get-Sddl "${Home}\${guid}\junction"         
Get-Sddl "D:\${guid}\test_dir"              
Get-Sddl "D:\${guid}\symbolic_link"         
Get-Sddl "D:\${guid}\junction"
Get-Sddl "E:\${guid}\test_dir"              
Get-Sddl "E:\${guid}\symbolic_link"         
Get-Sddl "E:\${guid}\junction"  
Get-Sddl "${Home}\${guid}\desktop.ini"      
Get-Sddl "${Home}\${guid}\symbolic_link_txt"
Get-Sddl "${Home}\${guid}\test_file.txt"    
Get-Sddl "${Home}\${guid}\hardlink"         
Get-Sddl "D:\${guid}\desktop.ini"           
Get-Sddl "D:\${guid}\symbolic_link_txt"     
Get-Sddl "D:\${guid}\test_file.txt"         
Get-Sddl "D:\${guid}\hardlink"
Get-Sddl "E:\${guid}\desktop.ini"           
Get-Sddl "E:\${guid}\symbolic_link_txt"     
Get-Sddl "E:\${guid}\test_file.txt"         
Get-Sddl "E:\${guid}\hardlink" 
```

Finally, we collect the above outputs to reveal the correct `SDDLs` as
the following table, where
the`$UserSid = (Get-LocalUser -Name ([Environment]::UserName)).SID.Value`

| Type | Example Path | SDDL |
|----|----|----|
| `NonSystemDisk[NTFS]\Root` | `D:\` | `O:SYG:SYD:AI(A;OICIIO;SDGXGWGR;;;AU)(A;;0x1301bf;;;AU)(A;;FA;;;SY)(A;OICIIO;GA;;;SY)(A;OICIIO;GA;;;BA)(A;;FA;;;BA)(A;;0x1200a9;;;BU)(A;OICIIO;GXGR;;;BU)` |
| `NonSystemDisk[ReFS]\Root` | `E:\` | `O:BAG:SYD:AI(A;OICIIO;SDGXGWGR;;;AU)(A;;0x1301bf;;;AU)(A;OICIIO;GA;;;SY)(A;;FA;;;SY)(A;OICI;FA;;;BA)(A;;0x1200a9;;;BU)(A;OICIIO;GXGR;;;BU)` |
| `Home\Root` | `C:\Users\User` | `O:BAG:SYD:PAI(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;OICI;FA;;;${UserSid})` |
| `NonSystemDisk[NTFS]\System Volume Information` | `D:\System Volume Information` | `O:BAG:SYD:PAI(A;OICI;FA;;;SY)` |
| `NonSystemDisk[NTFS]\$Recycle.Bin` | `D:\$Recycle.Bin` | `O:${UserSid}G:${UserSid}D:PAI(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;;0x1201ad;;;BU)` |
| `NonSystemDisk[ReFS]\System Volume Information` | `E:\System Volume Information` | `O:BAG:SYD:PAI(A;OICI;FA;;;SY)` |
| `NonSystemDisk[ReFS]\$Recycle.Bin` | `E:\$Recycle.Bin` | `O:${UserSid}G:${UserSid}D:PAI(A;OICI;FA;;;SY)(A;OICI;FA;;;BA)(A;;0x1201ad;;;BU)` |
| `Home\Directory` | `C:\Users\User\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\test_dir` | `O:${UserSid}G:${UserSid}D:AI(A;OICIID;FA;;;SY)(A;OICIID;FA;;;BA)(A;OICIID;FA;;;${UserSid})` |
| `Home\SymbolicLinkDirectory` | `C:\Users\User\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\symbolic_link` | `O:BAG:${UserSid}D:AI(A;OICIID;FA;;;SY)(A;OICIID;FA;;;BA)(A;OICIID;FA;;;${UserSid})` |
| `Home\Junction` | `C:\Users\User\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\junction` | `O:${UserSid}G:${UserSid}D:AI(A;OICIID;FA;;;SY)(A;OICIID;FA;;;BA)(A;OICIID;FA;;;${UserSid})` |
| `NonSystemDisk[NTFS]\Directory` | `D:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\test_dir` | `O:${UserSid}G:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;OICIIOID;SDGXGWGR;;;AU)(A;ID;FA;;;SY)(A;OICIIOID;GA;;;SY)(A;ID;FA;;;BA)(A;OICIIOID;GA;;;BA)(A;ID;0x1200a9;;;BU)(A;OICIIOID;GXGR;;;BU)` |
| `NonSystemDisk[NTFS]\SymbolicLinkDirectory` | `D:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\symbolic_link` | `O:BAG:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;OICIIOID;SDGXGWGR;;;AU)(A;ID;FA;;;SY)(A;OICIIOID;GA;;;SY)(A;ID;FA;;;BA)(A;OICIIOID;GA;;;BA)(A;ID;0x1200a9;;;BU)(A;OICIIOID;GXGR;;;BU)` |
| `NonSystemDisk[NTFS]\Junction` | `D:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\junction` | `O:${UserSid}G:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;OICIIOID;SDGXGWGR;;;AU)(A;ID;FA;;;SY)(A;OICIIOID;GA;;;SY)(A;ID;FA;;;BA)(A;OICIIOID;GA;;;BA)(A;ID;0x1200a9;;;BU)(A;OICIIOID;GXGR;;;BU)` |
| `NonSystemDisk[ReFS]\Directory` | `E:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\test_dir` | `O:${UserSid}G:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;OICIIOID;SDGXGWGR;;;AU)(A;ID;FA;;;SY)(A;OICIIOID;GA;;;SY)(A;OICIID;FA;;;BA)(A;ID;0x1200a9;;;BU)(A;OICIIOID;GXGR;;;BU)` |
| `NonSystemDisk[ReFS]\SymbolicLinkDirectory` | `E:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\symbolic_link` | `O:BAG:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;OICIIOID;SDGXGWGR;;;AU)(A;ID;FA;;;SY)(A;OICIIOID;GA;;;SY)(A;OICIID;FA;;;BA)(A;ID;0x1200a9;;;BU)(A;OICIIOID;GXGR;;;BU)` |
| `NonSystemDisk[ReFS]\Junction` | `E:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\junction` | `O:${UserSid}G:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;OICIIOID;SDGXGWGR;;;AU)(A;ID;FA;;;SY)(A;OICIIOID;GA;;;SY)(A;OICIID;FA;;;BA)(A;ID;0x1200a9;;;BU)(A;OICIIOID;GXGR;;;BU)` |
| `Home\desktop.ini` | `C:\Users\User\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\desktop.ini` | `O:${UserSid}G:${UserSid}D:AI(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;FA;;;${UserSid})` |
| `Home\SymbolicLinkFile` | `C:\Users\User\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\symbolic_link_txt` | `O:BAG:${UserSid}D:AI(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;FA;;;${UserSid})` |
| `Home\File` | `C:\Users\User\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\test_file.txt` | `O:${UserSid}G:${UserSid}D:AI(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;FA;;;${UserSid})` |
| `Home\HardLink` | `C:\Users\User\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\hardlink` | `O:${UserSid}G:${UserSid}D:AI(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;FA;;;${UserSid})` |
| `NonSystemDisk[NTFS]\desktop.ini` | `D:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\desktop.ini` | `O:${UserSid}G:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;0x1200a9;;;BU)` |
| `NonSystemDisk[NTFS]\SymbolicLinkFile` | `D:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\symbolic_link_txt` | `O:BAG:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;0x1200a9;;;BU)` |
| `NonSystemDisk[NTFS]\File` | `D:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\test_file.txt` | `O:${UserSid}G:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;0x1200a9;;;BU)` |
| `NonSystemDisk[NTFS]\HardLink` | `D:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\hardlink` | `O:${UserSid}G:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;0x1200a9;;;BU)` |
| `NonSystemDisk[ReFS]\desktop.ini` | `E:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\desktop.ini` | `O:${UserSid}G:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;0x1200a9;;;BU)` |
| `NonSystemDisk[ReFS]\SymbolicLinkFile` | `E:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\symbolic_link_txt` | `O:BAG:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;0x1200a9;;;BU)` |
| `NonSystemDisk[ReFS]\File` | `E:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\test_file.txt` | `O:${UserSid}G:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;0x1200a9;;;BU)` |
| `NonSystemDisk[ReFS]\HardLink` | `E:\ac6120eb-6f9e-4e75-9f4c-a41b576ffe3e\hardlink` | `O:${UserSid}G:${UserSid}D:AI(A;ID;0x1301bf;;;AU)(A;ID;FA;;;SY)(A;ID;FA;;;BA)(A;ID;0x1200a9;;;BU)` |

**See function**
[`Get-DefaultSddl`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Private/Tools/Authorization.ps1#L281)
for the codes that record and map the default `SDDLs` the above 28
types. We can use this function as

``` powershell
#Requires -Version 7.0
#Requires -RunAsAdministrator
$path_type = Get-PathType $some_path
$dddl = Get-DefaultSddl -PathType $path_type
Write-Host $dddl
```

So, by the codes in
[`Get-DefaultSddl`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Private/Tools/Authorization.ps1#L281),
there is no need to generate the above 28 path examples and get there
`SDDLs` again.

## A.4 Reset `SDDL`

Even though items’ attributes in a file system, such as `Hidden`,
`Archive`, are not directly related to `SDDLs`, these attributes are
still user-concerning and sometimes in non-default status. Which may
also bring unprespected effects to users. For example, you may find a
non-hidden `desktop.ini` occasionally within drive `D:\` . In order to
address these issues together, we can use the
[`Reset-PathAttribute`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Private/Tools/Authorization.ps1#L37)
function to reset any items as long as they meet the following 8 types:

| Type      | Specific Path Example           | Default Attributes        |
|-----------|---------------------------------|---------------------------|
| Directory | `X:\`                           | Hidden, System, Directory |
| Directory | `X:\System Volume Information\` | Hidden, System, Directory |
| Directory | `X:\$Recycle.Bin\`              | Hidden, System, Directory |
| Directory | `X:\*some_symbolic_link_dir\`   | Directory, ReparsePoint   |
| Directory | `X:\*some_junction\`            | Directory, ReparsePoint   |
| File      | `X:\*desktop.ini`               | Hidden, System, Archive   |
| File      | `X:\*some_symbolic_link_file`   | Archive, ReparsePoint     |
| File      | `X:\*some_hardlink`             | Archive                   |

Here the `X` represents any drive disk letter. And, if `X` represents
the system disk drive letter, such as `C`, the path should only be or in
`${Home}`. Other directories’ attriibuts will not be reset. Other files’
attriibuts will not be reset as well.

Then, the follwing are the main procedures of reseting the `SDDLs` of
the items that appear [A.2 Types of Items](#A.2 Types of Items)
(Supposing we have the
[`Get-PathType`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Private/Tools/Authorization.ps1#L132)
function and
[`Get-DefaultSddl`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Private/Tools/Authorization.ps1#L281)
function already.):

``` powershell
$path_type = Get-PathType $some_path
$sddl = Get-DefaultSddl -PathType $path_type
$new_acl = Get-Acl -LiteralPath $some_path
Reset-PathAttribute $some_path
$new_acl.SetSecurityDescriptorSddlForm($sddl)
```

**See function**
[`Reset-Authorization`](https://github.com/Zhaopudark/PSComputerManagementZp/blob/2d44507837ecca35726aeae5c6439dc6e2bb97f4/Module/Public/Manager.Authorization.ps1#L1C1-L102C2)
for a whole procedure to deal with authorization problems.

[^1]: (2023, March 19). Authorization. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/authorization-portal

[^2]: (2023, March 19). Access Control (Authorization). Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control

[^3]: (2023, March 20). Access Control Model. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-model

[^4]: (2023, March 21). Parts of the Access Control Model. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-components

[^5]: (2023, March 21). Parts of the Access Control Model. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-components

[^6]: (2023, March 21). Access Tokens. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/access-tokens

[^7]: (2023, March 21). Parts of the Access Control Model. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-components

[^8]: (2023, March 21). Security Descriptors. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptors

[^9]: (2023, March 21). Security Descriptors. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptors

[^10]: (2023, March 21). Security Descriptors. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptors

[^11]: (2023, March 21). Security Descriptors. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptors

[^12]: (2023, March 21). Security Descriptors. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptors

[^13]: (2023, March 21). Securable Objects. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/securable-objects

[^14]: (2023, March 21). Security Identifiers. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/security-identifiers

[^15]: (2023, March 19). Access-control list - Wikipedia. En. https://en.wikipedia.org/wiki/Access-control_list

[^16]: (2023, March 21). Access control lists. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists

[^17]: (2023, March 21). Access Control Entries. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-entries

[^18]: (2023, March 21). Access control lists. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists

[^19]: (2023, March 21). Access control lists. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists

[^20]: (2023, March 21). How AccessCheck Works. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/how-dacls-control-access-to-an-object

[^21]: (2023, March 21). Interaction Between Threads and Securable Objects. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/interaction-between-threads-and-securable-objects

[^22]: (2023, March 21). DACLs and ACEs. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/dacls-and-aces

[^23]: (2023, March 21). Null DACLs and Empty DACLs (Authorization). Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/null-dacls-and-empty-dacls

[^24]: (2023, March 20). Security Descriptor Definition Language. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptor-definition-language

[^25]: (2023, March 21). Security Descriptor String Format. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/security-descriptor-string-format

[^26]: (2023, March 21). ACE Strings. Learn. https://learn.microsoft.com/en-us/windows/win32/secauthz/ace-strings

[^27]: (2023, March 21). icacls. Learn. https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/icacls
