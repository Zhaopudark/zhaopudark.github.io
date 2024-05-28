---
abbrlink: 34195fcb
categories: Topics
date: "2024-04-26 18:04:05"
math: true
mathjax: true
tags:
- Mathematics
- Algorithm
title: Analyses of round function
updated: "2024-05-28 23:44:04"
---

This article does a mathematical abstraction of the
`rounding-to-integer` function
$round(\cdot):\mathbb{R}\rightarrow \mathbb{Z}$, and gives out some
analyses of some cases.

These analyses’ results will help in the derivations of some algorithms.
Later, more cases and analyses may also be added here.

<!-- more -->

# Introduction

> **Rounding** or **rounding off** means replacing a
> [number](https://en.wikipedia.org/wiki/Number) with an
> [approximate](https://en.wikipedia.org/wiki/Approximation) value that
> has a shorter, simpler, or more explicit representation. For example,
> replacing $23.4476$ with $23.45$, the
> [fraction](https://en.wikipedia.org/wiki/Fraction) $312/937$ with
> $1/3$, or the expression $\sqrt{2}$ with $1.414$.[^1]

General, there are many [rounding
types/forms](https://en.wikipedia.org/wiki/Rounding#Types_of_rounding),
including [rounding to
integer](https://en.wikipedia.org/wiki/Rounding#Rounding_to_integer),
[rounding to a specified
multiple](https://en.wikipedia.org/wiki/Rounding#Rounding_to_a_specified_multiple),
[logarithmic
rounding](https://en.wikipedia.org/wiki/Rounding#Logarithmic_rounding),
etc.

- To simplify, we only focus on [rounding to
  integer](https://en.wikipedia.org/wiki/Rounding#Rounding_to_integer),
  i.e., we only focus on the mapping
  $round(\cdot):\mathbb{R}\rightarrow \mathbb{Z}$, instead of
  $round(\cdot):\mathbb{R}\rightarrow \mathbb{R}$.
- This article aims to give analyses of rounding functions for the
  derivation of some algorithms. So, we only talk about [rounding
  functions in programming
  languages](https://en.wikipedia.org/wiki/Rounding#Rounding_functions_in_programming_languages).
- Additionally, several (programming) languages follow the lead of the
  [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754) floating-point
  standard[^2]. Therefore, we talk about the function
  $round(\cdot):\mathbb{R}\rightarrow \mathbb{Z}$ that only based on
  [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754).

Because it is not usually possible for a method to satisfy all ideal
characteristics, many different rounding methods/modes exist.[^3] So,
when it come to programming languages, the rounding modes may be not
unique, leading to different numerical characteristics. As the
consequence, it will be very convenient if we do mathematical
abstraction on these rounding methods, instead of just using natural
language.

In the next sections, we will give out mathematical representation
($round(\cdot):\mathbb{R}\rightarrow \mathbb{Z}$) of each rounding mode
first, and then give out some cases that use the rounding function,
along with some analyses, whose results may be very helpful in the
derivation of some computer algorithms.

# Definition of $round(\cdot):\mathbb{R}\rightarrow \mathbb{Z}$

According to the **rounding rules** of **Floating-Point Arithmetic**
that defined in [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754),
there are five rounding modes:

> - Rounding to nearest
>
>   - **[Round to nearest, ties to
>     even](https://en.wikipedia.org/wiki/Rounding#Round_half_to_even)**
>     – rounds to the nearest value; if the number falls midway, it is
>     rounded to the nearest value with an even least significant
>     digit.[^4]
>
>   - **[Round to nearest, ties away from
>     zero](https://en.wikipedia.org/wiki/Rounding#Round_half_away_from_zero)**
>     (or **ties to away**) – rounds to the nearest value; if the number
>     falls midway, it is rounded to the nearest value above (for
>     positive numbers) or below (for negative numbers).[^5]
>
> - Directed roundings
>
>   - **Round toward 0** – directed rounding towards zero (also known as
>     *truncation*).[^6]
>
>   - **Round toward +∞** – directed rounding towards positive infinity
>     (also known as *rounding up* or *ceiling*).[^7]
>
>   - **Round toward −∞** – directed rounding towards negative infinity
>     (also known as *rounding down* or *floor*).[^8]

We do mathematical abstraction and representation for each rounding
mode, giving out the corresponding
$round(\cdot):\mathbb{R}\rightarrow \mathbb{Z}$ function as:

- `to nearest, ties to even`: $$
  \begin{equation}\label{round_1}\tag{1}
  \forall x \in \mathbb{R},~round_1(x)=
    \begin{cases}
  \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor<0.5 \\
  \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor=0.5,\lfloor x\rfloor \mod 2=0\\
    \lceil x\rceil,\text{if }x-\lfloor x\rfloor=0.5,\lceil x\rceil\mod 2= 0\\
    \lceil x\rceil,\text{if }x-\lfloor x\rfloor>0.5
    \end{cases}
  \end{equation}
  $$

- `to nearest, ties away from zero` $$
  \begin{equation}\label{round_2}\tag{2}
  \forall x \in \mathbb{R},~round_2(x)=
  \begin{cases}
   \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor<0.5 \\
   \lceil x\rceil,\text{if }x-\lfloor x\rfloor=0.5,x > 0\\
  \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor=0.5,x<0\\
  \lceil x\rceil,\text{if }x-\lfloor x\rfloor>0.5
  \end{cases}
  \end{equation}
  $$

- `Round toward 0` $$
  \begin{equation}\label{round_3}\tag{3}
  \forall x \in \mathbb{R},round_3(x)=truncate(x)
  \begin{cases}
  \lfloor x\rfloor,\text{if }x \ge 0\\
  \lceil x\rceil,\text{if }x<0
  \end{cases}
  \end{equation}
  $$

- `Round toward +∞` $$
  \begin{equation}\label{round_4}\tag{4}
  \forall x \in \mathbb{R},round_4(x)=ceil(x)=\lceil x\rceil
  \end{equation}
  $$

- `Round toward −∞` $$
  \begin{equation}\label{round_5}\tag{5}
  \forall x \in \mathbb{R},round_5(x)=floor(x)=\lfloor x\rfloor
  \end{equation}
  $$

# Range Analysis on some cases.

In this section, we post out some cases where the rounding function
$round(\cdot) \mathbb{R}\rightarrow \mathbb{Z}$ is used

## Data Dividing

Data dividing is a Nonlinear Integer Programming (NIP) problem as
[如何不遗漏不重复地将列表元素按照指定比率划分?](https://www.zhihu.com/question/543548568).

Here we do not discuss the problem, but analyze a function used in it,
which is base on $round(\cdot) \mathbb{R}\rightarrow \mathbb{Z}$.

- Define
  $D_{r,n,N}=\{(r,n,N)| n\in \mathbb{Z}^+,N \in \mathbb{Z}^+, n \le N, r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$
- Define
  $f(r,n,N):\{\mathbb{R}^n,\mathbb{Z}^+,\mathbb{Z}^+\}\rightarrow\{\mathbb{Z}\}$
  as:
  - $\forall (r,n,N) \in D_{r,n,N}$, there is
    $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N$
- $\forall n \in \mathbb{Z}^+$, define
  $D_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.
- $\forall n \in \mathbb{Z}^+$, define the function $f(r,n,N)$’s value
  range set $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}$.

Let’s consider the value range $D_n$ for each mode. Since
$\forall (r,n,N) \in D_{r,n,N}$, there is $r_{i}N > 0$. So, for
simplify, we only need to consider
$\forall x \in \mathbb{R}^+ \cup \{0\}$, instead of
$\forall x \in \mathbb{R}$ for each mode’s $round(\cdot)$ function.

{% note info %}

Actually, the domain $\mathbb{R}^+$ is smaller than
$\mathbb{R}^+ \cup \{0\}$. But we still hope to maintain $round(\cdot)$
function’s [idempotence](https://en.wikipedia.org/wiki/Idempotence). So,
the $0$ is also necessary.

{% endnote %}

- If choose $round(\cdot)=round_1(\cdot)$ as $\eqref{round_1}$, there is
  $f_1(r,n,N)$’s value range set
  $F_{1,n}=\{f_1(r,n,N)|(r,N)\in D_{r,N}\}=\{x|x \in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.
  See [appendix A.1](#A.1) for analysis process.
- If choose $round_2(\cdot)$ as $\eqref{round_2}$, there is
  $f_2(r,n,N)$’s value range set
  $F_{2,n}=\{f_2(r,n,N)|(r,N)\in D_{r,N}\}=\{x|x \in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.
  See [appendix A.2](#A.2) for analysis process.
- If choose $round_3(\cdot)$ as $\eqref{round_3}$, there is
  $f_3(r,n,N)$’s value range set
  $F_{3,n}=\{f_3(r,n,N)|(r,N)\in D_{r,N}\}=\{x|x \in (-n,0],x\in \mathbb{Z}\}$.
  See [appendix A.3](#A.3) for analysis process.
- If choose $round_4(\cdot)$ as $\eqref{round_4}$, there is
  $f_4(r,n,N)$’s value range set
  $F_{4,n}=\{f_4(r,n,N)|(r,N)\in D_{r,N}\}=\{x|x \in [0,n),x\in \mathbb{Z}\}$.
  See [appendix A.4](#A.4) for analysis process.
- If choose $round_5(\cdot)$ as $\eqref{round_5}$, it is equivalent to
  $\eqref{round_3}$ in the restricted domain $\mathbb{R}^+ \cup \{0\}$.
  So, there is $f_5(r,n,N)$’s value range set
  $F_{5,n}=\{f_5(r,n,N)|(r,N)\in D_{r,N}\}=\{x|x \in (-n,0],x\in \mathbb{Z}\}$.
  See [appendix A.3](#A.3) for analysis process.

# Appendix

## A.1

- Given $round(x)$, where
  $\forall x \in \mathbb{R}^+\cup\{0\},round(x)=\begin{cases}
      \lfloor x\rfloor, &\text{if }&x-\lfloor x\rfloor<0.5 \\
      \lfloor x\rfloor,&\text{if }&x-\lfloor x\rfloor=0.5,\lfloor x\rfloor \mod 2=0\\
      \lceil x\rceil, &\text{if }&x-\lfloor x\rfloor=0.5,\lceil x\rceil\mod 2= 0\\
      \lceil x\rceil, &\text{if }&x-\lfloor x\rfloor>0.5
      \end{cases}$. Its domain of definition is restricted to
  $\mathbb{R}^+\cup\{0\}$ instead of $\mathbb{R}$, and in this domain,
  it is equivalent to $\eqref{round_1}$.
- Define:
  - $D_{r,n,N}=\{(r,n,N)|n \in\mathbb{Z}^+,N \in\mathbb{Z}^+, n \le N,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$
  - $f(r,n,N):\{\mathbb{R}^n,\mathbb{Z}^+,\mathbb{Z}^+\}\rightarrow\{\mathbb{Z}\}$
    as:
    - $\forall (r,n,N) \in D_{r,n,N}$, there is
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N$.
  - $\forall n \in \mathbb{Z}^+$,
    $D_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.
- Question:
  - $\forall n \in \mathbb{Z}^+$, try to find the function $f(r,n,N)$’s
    value range set $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}$.

Take the following steps:

1.  $\forall x \in \mathbb{R}^+\cup\{0\}, -0.5 \le round(x)-x\le 0.5$

    Proof:

    $\forall x \in \mathbb{R}^+\cup\{0\}$

    - If $x-\lfloor x\rfloor<0.5$, $round(x)-x=\lfloor x\rfloor-x$.
      - There are $\lfloor x\rfloor-x>-0.5$,
      - and, $\lfloor x\rfloor-x\le 0$.
      - So, $-0.5 < \lfloor x\rfloor-x\le 0$,
      - i.e., $-0.5 < round(x)-x\le 0$.
    - If $x-\lfloor x\rfloor=0.5,\lfloor x\rfloor \mod 2=0$,
      $round(x)-x=\lfloor x\rfloor-x= -0.5$
      - i.e., $round(x)-x = -0.5$.
    - If $x-\lfloor x\rfloor=0.5,\lceil x\rceil \mod 2=0$, so
      $x\notin \mathbb{Z}$，$round(x)-x=\lceil x\rceil-x =\lfloor x\rfloor+1-x=1-0.5=0.5$
      - i.e., $round(x)-x = 0.5$.
    - If $x-\lfloor x\rfloor> 0.5$, so $x\notin \mathbb{Z}$, so,
      $round(x)-x=\lceil x\rceil-x=\lfloor x\rfloor+1-x$.
      - There are $\lfloor x\rfloor+1-x< -0.5+1=0.5$,
      - and $\lceil x\rceil-x>0$.
      - So, $0 < round(x)-x< 0.5$.
    - So, combine the above 4 conditions, there is
      $-0.5 \le round(x)-x < 0.5$

    So, `1` is proofed.

2.  $\forall n \in \mathbb{Z}^+$,
    $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}\subseteq \{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in D_{r,N}, \sum_{i=1}^{n}r_iN=N$.
    - So,
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n round(r_{i}N)-r_{i}N],\text{where } (r,N)\in D_{r,N}$.
    - According to `1`, there will be
      $\forall i \in \{i|i\in [1,n],i \in \mathbb{Z}\}, -0.5\le round(r_{i}N)-r_{i}N\le 0.5$.
    - So,
      $\forall (r,N)\in D_{r,N}, -0.5n \le \sum_{i=1}^n round(r_{i}N)-r_{i}N \le 0.5n$,
    - i.e.,$\forall (r,N)\in D_{r,N}, -0.5n \le f(r,n,N)\le 0.5n$.
    - And obviously, there is $f(r,n,N)\in \mathbb{Z}$,
    - so,
      $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}\subseteq \{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.

    So, `2` is proofed.

3.  $\forall n \in \mathbb{Z}^+$,
    $\{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in D_{r,N}, \sum_{i=1}^{n}r_iN=N$.

    - So,
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n round(r_{i}N)-r_{i}N],\text{where } (r,N)\in D_{r,N}$.

    - So, if $n=2k, k\in \mathbb{Z}^+$, then,

      - $\forall t\in \{t | t\in[0,2k], t\in \mathbb{Z}\}$, let: $$
        \begin{split}
        &N=3k+t\\
        &r=[r_1,r_2,\ldots,r_n],\\
        &~\forall i \in \{i|i\in[1,t],i\in \mathbb{Z}\}, r_i=\frac{2.5}{N},round(r_iN)-r_iN=round(2.5)-2.5=-0.5,\\
        &~\forall i \in \{i|i\in[t+1,2k],i\in \mathbb{Z}\}, r_iN=\frac{1.5}{N},round(r_iN)-r_iN=round(1.5)-1.5=0.5\\
        &~\sum_{i}^{n}r_i=\frac{2.5t+1.5(2k-t)}{N}=\frac{3k+t}{N}=1
        \end{split}
        $$

        - Obviously, $(r,N)\in D_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=-0.5t+(2k-t)*0.5\\
          &=k-t
          \end{split}
          $$

        - So, $\{x|x\in[-k,k],x\in \mathbb{Z}\}\subseteq F_n$.

      So,
      $\{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq F_n$.

    - And, if $n=2k-1,k\in \mathbb{Z}^+$, then,

      - $\forall t\in \{t|t\in [1,2k-1], t \in \mathbb{Z}\}$, let: $$
        \begin{split}
        &N=3k+t \\
        &r=[r_1,r_2,\ldots,r_n],\\
        &~\forall i \in \{1\}, r_i=\frac{4}{N},round(r_iN)-r_iN=round(4)-4=0,\\
        &~\forall i \in \{i|i\in [2,t],i \in \mathbb{Z}\}, r_i=\frac{2.5}{N},round(r_iN)-r_iN=round(2.5)-2.5=-0.5,\\
        &~\forall i \in \{i|i\in [t+1,2k-1],i \in \mathbb{Z}\},r_iN=\frac{1.5}{N},round(r_iN)-r_iN=round(1.5)-1.5=0.5\\
        &~\sum_{i}^{n}r_i=\frac{4+2.5(t-1)+1.5(2k-1-t)}{N}=\frac{3k+t}{N}=1
        \end{split}
        $$

        - Obviously, $(r,N)\in D_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=0-0.5(t-1)+(2k-1-t)*0.5\\
          &=-0.5t+0.5+k-0.5-0.5t\\
          &=k-t
          \end{split}
          $$

        - So, $\{x|x\in[-k+1,k-1],x\in \mathbb{Z}\}\subseteq F_n$.

      So,
      $\{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq F_n$.

    So, `3` is proofed.

4.  Combine `2` and `3`:
    $\forall n \in \mathbb{Z}^+, F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}=\{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.

## A.2

- Given $round(x)$, where
  $\forall x \in \mathbb{R}^+\cup\{0\},~round(x)=\begin{cases} \lfloor x\rfloor, \text{if }x-\lfloor x\rfloor<0.5 \\ \lceil x\rceil, \text{if }x-\lfloor x\rfloor \ge 0.5 \end{cases}$.
  Its domain of definition is restricted to $\mathbb{R}^+\cup\{0\}$
  instead of $\mathbb{R}$, and in this domain, it is equivalent to
  $\eqref{round_2}$.
- Define:
  - $D_{r,n,N}=\{(r,n,N)|n \in\mathbb{Z}^+,N \in\mathbb{Z}^+, n \le N,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$
  - $f(r,n,N):\{\mathbb{R}^n,\mathbb{Z}^+,\mathbb{Z}^+\}\rightarrow\{\mathbb{Z}\}$
    as:
    - $\forall (r,n,N) \in D_{r,n,N}$, there is
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N$.
  - $\forall n \in \mathbb{Z}^+$,
    $D_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.
- Question:
  - $\forall n \in \mathbb{Z}^+$, try to find the function $f(r,n,N)$’s
    value range set $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}$.

Take the following steps:

1.  $\forall x \in \mathbb{R}^+\cup\{0\}, -0.5 < round(x)-x\le 0.5$

    Proof:

    $\forall x \in \mathbb{R}^+\cup\{0\}$

    - If $x-\lfloor x\rfloor<0.5$, $round(x)-x=\lfloor x\rfloor-x$.
      - There are $\lfloor x\rfloor-x>-0.5$,
      - and, $\lfloor x\rfloor-x\le 0$.
      - So, $-0.5 < round(x)-x\le 0$.
    - If $x-\lfloor x\rfloor\ge 0.5$, so $x\notin \mathbb{Z}$, so,
      $round(x)-x=\lceil x\rceil-x=\lfloor x\rfloor+1-x$.
      - There are $\lfloor x\rfloor+1-x\le -0.5+1=0.5$,
      - and $\lceil x\rceil-x>0$.
      - So, $0 < round(x)-x\le 0.5$.
    - So, combine the above 2 conditions, there is
      $-0.5 < round(x)-x\le 0.5$

    So, `1` is proofed.

2.  $\forall n \in \mathbb{Z}^+$,
    $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}\subseteq \{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in D_{r,N}, \sum_{i=1}^{n}r_iN=N$.
    - So,
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n round(r_{i}N)-r_{i}N],\text{where } (r,N)\in D_{r,N}$.
    - According to `1`, there will be
      $\forall i \in \{i|i\in [1,n],i \in \mathbb{Z}\}, -0.5<round(r_{i}N)-r_{i}N\le 0.5$.
    - So,
      $\forall (r,N)\in D_{r,N}, -0.5n<\sum_{i=1}^n round(r_{i}N)-r_{i}N\le 0.5n$,
    - i.e., $\forall (r,N)\in D_{r,N}, -0.5n < f(r,n,N)\le 0.5n$.
    - And obviously, there is $f(r,n,N)\in \mathbb{Z}$,
    - so,
      $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\} \subseteq \{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$

    So, `2` is proofed.

3.  $\forall n \in \mathbb{Z}^+$,
    $\{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in D_{r,N}, \sum_{i=1}^{n}r_iN=N$.

    - So,
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n round(r_{i}N)-r_{i}N],\text{where } (r,N)\in D_{r,N}$.

    - So, if $n=2k, k\in \mathbb{Z}^+$, then,

      - $\forall t\in \{t | t\in[0,k], t\in \mathbb{Z}\}$, let: $$
        \begin{split}
        &N=2k\\
        &r=[r_1,r_2,\ldots,r_n],\\
        &~\forall i \in \{i|i\in[1,t],i\in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-1=0,\\
        &~\forall i \in \{i|i\in[t+1,k],i\in \mathbb{Z}\}, r_i=\frac{1.5}{N},round(r_iN)-r_iN=round(1.5)-1.5=0.5,\\
        &~\forall i \in \{i|i\in[k+1,k+t],i\in \mathbb{Z}\} r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-1=0,\\
        &~\forall i \in \{i|i\in[k+t+1,2k],i\in \mathbb{Z}\}, r_i=\frac{0.5}{N},round(r_iN)-r_iN=round(0.5)-0.5=0.5\\
        &~\sum_{i}^{n}r_i=\frac{t+1.5(k-t)+t+0.5(k-t)}{N}=\frac{2k}{N}=1
        \end{split}
        $$

        - Obviously, $(r,N)\in D_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=t*0+(k-t)*0.5+t*0+(k-t)*0.5\\
          &=k-t
          \end{split}
          $$

        - So, $\{x|x\in[0,k],x\in \mathbb{Z}\}\subseteq F_n$

      - $\forall t\in \{t|t\in[1,k-1],t\in \mathbb{Z}\}, \exists \Delta \rightarrow 0^+$,
        let: $$
        \begin{split}
        &N=2k\\
        &r=[r_1,r_2,\ldots,r_n],\\
        &~\forall i \in \{i|i\in[1,t],i\in \mathbb{Z}\}, r_i=\frac{1.5-\Delta}{N},round(r_iN)-r_iN=round(1.5-\Delta)-(1.5-\Delta)=-0.5+\Delta\\
        &~\forall i \in \{t+1\}, r_i=\frac{1+t\Delta}{N},round(r_iN)-r_iN=round(1+t\Delta)-(1+t\Delta)=-t\Delta\\
        &~\forall i \in \{i|i\in[t+2,k],i\in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-(1)=0\\
        &~\forall i \in \{i|i\in[k+1,k+t],i\in \mathbb{Z}\} r_i=\frac{0.5-\Delta}{N},round(r_iN)-r_iN=round(0.5-\Delta)-(0.5-\Delta)=-0.5+\Delta\\
        &~\forall i \in \{k+t+1\}, r_i=\frac{1+t\Delta}{N},round(r_iN)-r_iN=round(1+t\Delta)-(1+t\Delta)=-t\Delta\\
        &~\forall i \in \{i|i\in[k+t+2,2k],i\in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-(1)=0\\
        &~\sum_{i}^{n}r_i=\frac{t(1.5-\Delta)+1+t\Delta+k-t-1+t(0.5-\Delta)+1+t\Delta+k-t-1}{N}\\
        &~=\frac{1.5t\cancel{-t\Delta}\cancel{+1}\cancel{+t\Delta}+k-t\cancel{-1}+0.5t\cancel{-t\Delta}\cancel{+1}+\cancel{t\Delta}+k-t\cancel{-1}}{N}=1
        \end{split}
        $$

        - Obviously, $(r,N)\in D_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=t*(-0.5+\Delta)-t\Delta+(k-t-1)*0\\
          &~~~~+t*(-0.5+\Delta)-t\Delta+(k-t-1)*0\\
          &=-t
          \end{split}
          $$

        - So, $\{x|x\in[-k+1,-1],x\in \mathbb{Z}\}\subseteq F_n$

        Therefore, there is
        $\{x|x\in[-k+1,k],x \in \mathbb{Z}\}\subseteq F_n$.

      So,
      $\{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq F_n$.

    - And, if $n=2k-1,k\in \mathbb{Z}^+$, then,

      - $\forall t\in \{t|t\in [1,k], t \in \mathbb{Z}\}$, let: $$
        \begin{split}
        &N=2k\\
        &r=[r_1,r_2,\ldots,r_n],\\
        &~~\forall i \in \{1\}, r_i=\frac{2}{N},round(r_iN)-r_iN=round(2)-2=0,\\
        &~\forall i \in \{i|i \in [2,t],i \in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-1=0,\\
        &~\forall i \in \{i|i \in [t+1,k],i \in \mathbb{Z}\}, r_i=\frac{1.5}{N},round(r_iN)-r_iN=round(1.5)-1.5=0.5,\\
        &~\forall i \in \{i|i \in [k+1,k+t-1],i \in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-1=0,\\
        &~\forall i \in \{i|i \in [k+t,2k-1],i\in \mathbb{Z}\}, r_i=\frac{0.5}{N},round(r_iN)-r_iN=round(0.5)-0.5=0.5\\
        &~\sum_{i}^{n}r_i=\frac{2+t-1+1.5(k-t)+t-1+0.5(k-t)}{N}=1
        \end{split}
        $$

        - Obviously, $(r,N)\in D_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=0+(t-1)*0+(k-t)*0.5+(t-1)*0+(k-t)*0.5\\
          &=k-t
          \end{split}
          $$

        - So, $\{x|x\in[0,k-1],x\in \mathbb{Z}\}\subseteq F_n$

      - $\forall t\in \{t|t\in [2,k], t \in \mathbb{Z}\}$, let: $$
        \begin{split}
        &N=2k\\
        &r=[r_1,r_2,\ldots,r_n],\\
        &~\forall i \in \{1\}, r_i=\frac{2}{N},round(r_iN)-r_iN=round(2)-2=0,\\
        &~\forall i \in \{i|i\in [2,t],i\in \mathbb{Z}\}, r_i=\frac{1.5-\Delta}{N},round(r_iN)-r_iN=round(1.5-\Delta)-(1.5-\Delta)=-0.5+\Delta\\
        &~\forall i \in \{t+1\}, r_i=\frac{1+(t-1)\Delta}{N},round(r_iN)-r_iN=round(1+(t-1)\Delta)-(1+(t-1)\Delta)=-(t-1)\Delta\\
        &~\forall i \in \{i|i\in [t+2,k],i\in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-(1)=0\\
        &~\forall i \in \{i|i\in [k+1,k+t-1],i\in \mathbb{Z}\},r_i=\frac{0.5-\Delta}{N},round(r_iN)-r_iN=round(0.5-\Delta)-(0.5-\Delta)=-0.5+\Delta\\
        &~\forall i \in \{k+t\}, r_i=\frac{1+(t-1)\Delta}{N},round(r_iN)-r_iN=round(1+(t-1)\Delta)-(1+(t-1)\Delta)=-(t-1)\Delta\\
        &~\forall i \in \{i|i\in [k+t+1,2k-1],i\in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-(1)=0\\
        &~\sum_{i}^{n}r_i=\frac{2+(t-1)*(1.5-\Delta)+1+(t-1)\Delta+(k-t-1)+(t-1)*(0.5-\Delta)+1+(t-1)t\Delta+k-t-1}{4k}\\
        &~=\frac{2+(t-1)*(2-2\Delta)+2+2(t-1)\Delta+2(k-t-1)}{4k}=\frac{\cancel{2}\cancel{+2t}\cancel{-2}\cancel{-2t\Delta}\cancel{+2\Delta}\cancel{+2}\cancel{+2t\Delta}\cancel{-2\Delta}+2k\cancel{-2t}\cancel{-2}}{N}=1
        \end{split}
        $$

        - Obviously, $(r,N)\in D_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=0+(t-1)*(-0.5+\Delta)-(t-1)\Delta+(k-t-1)*0\\
          &~~~~+(t-1)*(-0.5+\Delta)-(t-1)\Delta+(k-t-1)*0\\
          &=(t-1)*(-0.5+\Delta-\Delta-0.5+\Delta-\Delta)\\
          &=1-t
          \end{split}
          $$

        - So, $\{x|x\in[-k+1,-1],x\in \mathbb{Z}\}\subseteq F_n$

        Therefore, there is
        $\{x|x\in[-k+1,k-1],x \in \mathbb{Z}\}\subseteq F_n$.

      So,
      $\{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq F_n$.

    So, `3` is proofed.

4.  Combine `2` and `3`:
    $\forall n \in \mathbb{Z}^+, F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}=\{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.

## A.3

- Given $round(x)$, where
  $\forall x \in \mathbb{R}^+\cup\{0\},~round(x)=truncate(x)=floor(x)=\lfloor x\rfloor$.
  Its domain of definition is restricted to $\mathbb{R}^+\cup\{0\}$
  instead of $\mathbb{R}$, and in this domain, it is equivalent to
  $\eqref{round_3}$ and $\eqref{round_5}$
- Define:
  - $D_{r,n,N}=\{(r,n,N)|n \in\mathbb{Z}^+,N \in\mathbb{Z}^+, n \le N,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$
  - $f(r,n,N):\{\mathbb{R}^n,\mathbb{Z}^+,\mathbb{Z}^+\}\rightarrow\{\mathbb{Z}\}$
    as:
    - $\forall (r,n,N) \in D_{r,n,N}$, there is
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n truncate(r_{i}N)]-N=[\sum_{i=1}^n floor(r_{i}N)]-N$.
  - $\forall n \in \mathbb{Z}^+$,
    $D_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.
- Question:
  - $\forall n \in \mathbb{Z}^+$, try to find the function $f(r,n,N)$’s
    value range set $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}$

Take the following steps:

1.  $\forall x \in \mathbb{R}^+\cup\{0\}, -1 < floor(x)-x\le 0$

    Proof:

    $\forall x \in \mathbb{R}^+\cup\{0\}$

    - $floor(x)-x=\lfloor x\rfloor -x$.
    - $\exists (k,b) \in \{(k,b)|k \in \mathbb{N},b\in [0,1), b\in \mathbb{R}\}$,
      that make $x=k+b$.
    - So, $\lfloor x\rfloor -x=k-(k+b)=-b$.
    - So, $\lfloor x\rfloor -x \in (-1,0]$,
    - i.e., $-1 < floor(x)-x\le 0$

    So, `1` is proofed.

2.  $\forall n \in \mathbb{Z}^+$,
    $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}\subseteq \{x|x\in (-n,0],x\in \mathbb{Z}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in D_{r,N}, \sum_{i=1}^{n}r_iN=N$
    - So,
      $f(r,n,N)=[\sum_{i=1}^n floor(r_{i}N)]-N=[\sum_{i=1}^n floor(r_{i}N)-r_{i}N],\text{where } (r,N)\in D_{r,N}$
    - According to `1`, there will be
      $\forall i \in \{i|i\in [1,n],i \in \mathbb{Z}\}, -1 < floor(r_{i}N)-r_{i}N\le 0$.
    - So,
      $\forall (r,N)\in D_{r,N}, -n < \sum_{i=1}^n floor(r_{i}N)-r_{i}N \le 0$,
    - i.e., $\forall (r,N)\in D_{r,N}, -n < f(r,n,N)\le 0$
    - And obviously, there is $f(r,n,N)\in \mathbb{Z}$,
    - so,
      $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}\subseteq \{x|x\in (-n,0],x\in \mathbb{Z}\}$.

    So, `2` is proofed.

3.  $\forall n \in \mathbb{Z}^+$,
    $\{x|x \in (-n,0],x\in \mathbb{Z}\}\subseteq F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in D_{r,N}, \sum_{i=1}^{n}r_iN=N$.

    - So,
      $f(r,n,N)=[\sum_{i=1}^n floor(r_{i}N)]-N=[\sum_{i=1}^n floor(r_{i}N)-r_{i}N],\text{where } (r,N)\in D_{r,N}$.

    - $\forall t\in \{t | t\in[0,n-1], t\in \mathbb{Z}\}, \exists \Delta \rightarrow 0^+$,
      let: $$
      \begin{split}
      &N=n\\
      &r=[r_1,r_2,\ldots,r_n],\\
      &~\forall i \in \{i|i\in[1,t],i\in \mathbb{Z}\}, r_i=\frac{1-\Delta}{N},floor(r_iN)-r_iN=floor(1-\Delta)-(1-\Delta)=-1+\Delta,\\
      &~\forall i \in \{t+1\}, r_iN=\frac{1+t\Delta}{N},floor(r_iN)-r_iN=floor(1+t\Delta)-(1+t\Delta)=-t\Delta\\
      &~\forall i \in \{i|i\in[t+2,n],i\in \mathbb{Z}\}, r_iN=\frac{1}{N},floor(r_iN)-r_iN=floor(1)-1=0\\
      &~\sum_{i}^{n}r_i=\frac{t(1-\Delta)+1+t\Delta+n-t-1}{N}=\frac{n}{N}=1
      \end{split}
      $$

      - Obviously, $(r,N)\in D_{r,N}$.

      - Then $$
        \begin{split}
        f(r,n,N)&=[\sum_{i=1}^n floor(r_{i}N)-r_{i}N]\\
        &=t(-1+\Delta)-t\Delta+0*(n-t-1)\\
        &=-t
        \end{split}
        $$

      - So, $\{x|x\in[-n+1,0],x\in \mathbb{Z}\}\subseteq F_n$,

      Therefore, $\{x|x \in (-n,0],x\in \mathbb{Z}\}\subseteq F_n$.

    So, `3` is proofed.

4.  Combine `2` and `3`:
    $\forall n \in \mathbb{Z}^+, F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}=\{x|x\in (-n,0],x\in \mathbb{Z}\}$.

## A.4

- Given $round(x)$, where
  $\forall x \in \mathbb{R}^+\cup\{0\},~round(x)=ceil(x)=\lceil x\rceil$.
  Its domain of definition is restricted to $\mathbb{R}^+\cup\{0\}$
  instead of $\mathbb{R}$, and in this domain, it is equivalent to
  $\eqref{round_4}$.
- Define:
  - $D_{r,n,N}=\{(r,n,N)|n \in\mathbb{Z}^+,N \in\mathbb{Z}^+, n \le N,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$
  - $f(r,n,N):\{\mathbb{R}^n,\mathbb{Z}^+,\mathbb{Z}^+\}\rightarrow\{\mathbb{Z}\}$
    as:
    - $\forall (r,n,N) \in D_{r,n,N}$, there is
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n truncate(r_{i}N)]-N=[\sum_{i=1}^n floor(r_{i}N)]-N$.
  - $\forall n \in \mathbb{Z}^+$,
    $D_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.
- Question:
  - $\forall n \in \mathbb{Z}^+$, try to find the function $f(r,n,N)$’s
    value range set $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}$

Take the following steps:

1.  $\forall x \in \mathbb{R}^+\cup\{0\}, 0 \le ceil(x)-x < 1$

    Proof:

    $\forall x \in \mathbb{R}^+\cup\{0\}$

    - $ceil(x)-x=\lceil x\rceil -x$.
    - $\exists (k,b) \in \{(k,b)|k \in \mathbb{N},b\in [0,1), b\in \mathbb{R}\}$,
      that make $x=k-b$.
    - So, $\lceil x\rceil -x=k-(k-b)=+b$.
    - So, $\lfloor x\rfloor -x \in [0,1)$,
    - i.e., $0 \le ceil(x)-x < 1$

    So, `1` is proofed.

2.  $\forall n \in \mathbb{Z}^+$,
    $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}\subseteq \{x|x\in [0,n),x\in \mathbb{Z}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in D_{r,N}, \sum_{i=1}^{n}r_iN=N$
    - So,
      $f(r,n,N)=[\sum_{i=1}^n ceil(r_{i}N)]-N=[\sum_{i=1}^n ceil(r_{i}N)-r_{i}N],\text{where } (r,N)\in D_{r,N}$
    - According to `1`, there will be
      $\forall i \in \{i|i\in [1,n],i \in \mathbb{Z}\}, 0 \le floor(r_{i}N)-r_{i}N < 1$.
    - So,
      $\forall (r,N)\in D_{r,N}, 0 \le \sum_{i=1}^n floor(r_{i}N)-r_{i}N < 1$,
    - i.e., $\forall (r,N)\in D_{r,N}, 0 \le f(r,n,N) < 0$
    - And obviously, there is $f(r,n,N)\in \mathbb{Z}$,
    - so,
      $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}\subseteq \{x|x\in [0,n),x\in \mathbb{Z}\}$.

    So, `2` is proofed.

3.  $\forall n \in \mathbb{Z}^+$,
    $\{x|x \in [0,n),x\in \mathbb{Z}\}\subseteq F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in D_{r,N}, \sum_{i=1}^{n}r_iN=N$.

    - So,
      $f(r,n,N)=[\sum_{i=1}^n ceil(r_{i}N)]-N=[\sum_{i=1}^n ceil(r_{i}N)-r_{i}N],\text{where } (r,N)\in D_{r,N}$.

    - $\forall t\in \{t | t\in[0,n-1], t\in \mathbb{Z}\}, \exists \Delta \rightarrow 0^+$,
      let: $$
      \begin{split}
      &N=n\\
      &r=[r_1,r_2,\ldots,r_n],\\
      &~\forall i \in \{i|i\in[1,t],i\in \mathbb{Z}\}, r_i=\frac{1+\Delta}{N},ceil(r_iN)-r_iN=ceil(1+\Delta)-(1+\Delta)=1-\Delta,\\
      &~\forall i \in \{t+1\}, r_iN=\frac{1-t\Delta}{N},ceil(r_iN)-r_iN=ceil(1-t\Delta)-(1-t\Delta)=t\Delta\\
      &~\forall i \in \{i|i\in[t+2,n],i\in \mathbb{Z}\}, r_iN=\frac{1}{N},ceil(r_iN)-r_iN=ceil(1)-1=0\\
      &~\sum_{i}^{n}r_i=\frac{t(1+\Delta)+1-t\Delta+n-t-1}{N}=\frac{n}{N}=1
      \end{split}
      $$

      - Obviously, $(r,N)\in D_{r,N}$.

      - Then $$
        \begin{split}
        f(r,n,N)&=[\sum_{i=1}^n ceil(r_{i}N)-r_{i}N]\\
        &=t(1-\Delta)+t\Delta+0*(n-t-1)\\
        &=t
        \end{split}
        $$

      - So, $\{x|x\in[0,n-1],x\in \mathbb{Z}\}\subseteq F_n$,

      Therefore, $\{x|x \in [0,n),x\in \mathbb{Z}\}\subseteq F_n$.

    So, `3` is proofed.

4.  Combine `2` and `3`:
    $\forall n \in \mathbb{Z}^+, F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}=\{x|x\in [0,n),x\in \mathbb{Z}\}$.

[^1]: 《Rounding》, Wikipedia. 2024年4月17日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=Rounding&oldid=1219417301

[^2]: 《Rounding》, Wikipedia. 2024年4月17日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=Rounding&oldid=1219417301

[^3]: 《Rounding》, Wikipedia. 2024年4月17日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=Rounding&oldid=1219417301

[^4]: 《IEEE 754》, Wikipedia. 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rules

[^5]: 《IEEE 754》, Wikipedia. 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rules

[^6]: 《IEEE 754》, Wikipedia. 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rules

[^7]: 《IEEE 754》, Wikipedia. 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rules

[^8]: 《IEEE 754》, Wikipedia. 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rules
