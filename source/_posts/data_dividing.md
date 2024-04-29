---
abbrlink: 7d227c9
categories: Topics
date: "2023-10-25 16:22:37"
math: true
mathjax: true
tags:
- Mathematics
- Machine Learning
- Algorithm
- Python
title: Derived from splitting data into 3 parts, a better way to divide
  a list of same type elements into ‘n’ parts according to ratios,
  without repetition or leaking
updated: "2024-04-29 17:13:34"
---

This article discusses an operation that originated in machine learning,
i.e., how to divide a dataset with the same type of elements by a series
of proportions, focusing on dealing with decimal rounding problems.

Partitioning datasets by proportions is a sub-operation when doing
stratified sampling for all types of samples. Therefore, in this
article, we only discuss this low-level sub-operation and do not discuss
higher-level operations such as stratified sampling. That is, this
article always regards the operated dataset’s elements as the same
class.

Initially, this operation was not an algorithmic problem, but a simple
engineering problem for programming implementation. However, we
performed further thoughts and analysis, refined this operation into an
algorithmic problem, and then gave out a solution. This article records
these processes.

<!-- more -->

# Introduction

First, let’s look at an example, i.e., how to divide a dataset
consisting of all $248$ positive samples into train set, validate set
and test set, according to proportions $0.7,0.1,0.2$? Not how to program
it, but how to determine the number of elements in each set? Simply
multiplying the total number of elements by the ratio will result in a
fractional part:

$$
\begin{split}
&train~set: &248\times0.7=173.6\\
&validate~set: &248\times0.1=24.8\\
&test~set: &248\times0.2=49.6
\end{split}
$$

**How to handle decimals?** There are at least the following options and
their dilemmas:

- Totally round by $floor(\cdot)$: train set get $173$, validate set get
  $24$, test set get $49$

  - But $173+24+49=246<248$, 2 elements will be dropped. Which 2
    elements will be chosen to be dropped? Why choose them but not other
    else?

- Totally round by $round(\cdot)$: train set get $174$, validate set get
  $25$, test set get $50$

  - But $174+25+50=249>248$ , lacking 1 element. Where to find an extra
    element? We should not make any overlap on these 3 sets.

- Follow one’s intuition, basing on the first option and manually divide
  more elements to train set and test set: train set get $174$, validate
  set get $24$, test set get $45$

  - It seems good because of $174+24+50=248\equiv 248$. But, why not
    divide more elements to validate set? And, can this result still be
    considered as the one according to ratios $0.7,0.1,0.2$ without any
    disputation?

Additionally, the above example is on a specific element total number
and specific proportions. If the total number and the proportions
change, what should we do with it? Are there any existing any publicly
available solutions? We have found the followings on [Stack
Overflow](https://stackoverflow.com/):

- [pandas - How to split data into 3 sets (train, validation and
  test)? - Stack
  Overflow](https://stackoverflow.com/questions/38250710/how-to-split-data-into-3-sets-train-validation-and-test)
- [python - Get a training set on pandas - Stack
  Overflow](https://stackoverflow.com/questions/49867027/get-a-training-set-on-pandas)
- [scikit learn - How to split data into 3 parts, one of which wont be
  used? - Stack
  Overflow](https://stackoverflow.com/questions/52134330/how-to-split-data-into-3-parts-one-of-which-wont-be-used)
- [scikit learn - How to split dataset to train, test and valid in
  Python? - Stack
  Overflow](https://stackoverflow.com/questions/64004193/how-to-split-dataset-to-train-test-and-valid-in-python)

In these solutions, people concern more about the program itself,
instead of whether the result is reasonable when encounter decimals. In
addition,
“[sklearn.model_selection.train_test_split](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.train_test_split.html)”
is widely use in these solutions to realize dataset partition. Is it
reasonable? Let’s do some further tests:

``` python
import numpy as np
from sklearn.model_selection import train_test_split
X, y = np.arange(8).reshape((4, 2)), range(4)
# with rate 0.6225,0.3775
X_train, X_test, y_train, y_test = train_test_split(X, y, train_size=0.6225, test_size=0.3775)
print("train set size:",len(X_train),"| test set size:",len(X_test))
# train set size: 2 | test set size: 2

# with rate 0.3775,0.6225
X_train, X_test, y_train, y_test = train_test_split(X, y, train_size=0.3775, test_size=0.6225)
print("train set size:",len(X_train),"| test set size:",len(X_test))
# train set size: 1 | test set size: 3
```

{% note primary %}

Apparently, `sklearn.model_selection.train_test_split` cannot deal with
the partition well:

- It has no certainty about the division ratio, and a simple order
  adjustment can affect the division result.
- It probabilistically uses simple rounding and completes the missing
  elements at the end of the division interval.

{% endnote %}

In order to deal with all situations when dividing a list of elements
into parts by proportions, we need to:

1.  Set a general partition standard, do not divide haphazardly without
    basis.
2.  According to the defined standard, give out objectives and
    requirements.
3.  Design algorithms to solve the objectives within the requirements.

See the following sections.

## Partition Standard

Set a general partition standard, do not divide haphazardly without
basis. Therefore, we give out a partition **standard**:

- **Non-omission**: Do not drop any element, as
  `sklearn.model_selection.train_test_split` does. It is difficult to
  find a reason to drop a particular element in a dataset. Why discard
  this element but not drop others else? It would be reckless to discard
  elements at will just because of the decimal problem (integer division
  problem). And, if some elements have been dropped, the dataset will a
  subset of the original one from the beginning, which will incur
  further problems in the theory section, particularly in the
  circumstance of small-size datasets. So, the best way is not to miss
  any element.
- **Non-overlapping**: Do not make any 2 divided partitions overlap.
  Overlapping, i.e., the same element appearing in 2 partitions
  simultaneously, can directly lead to a bad division that unable to
  use. For example, in machine learning, the overlapping between train
  set and test set is a serious and principled error that should not be
  allowed to occur.
- **Determinacy(Reproducibility)**: For a determined rate, the partition
  result should be deterministic. So, anyone can reproduce the result if
  the element total number and proportions known. Determinism is very
  important. Let alone the other problems of random seeds, weight
  initialization, and distribution training’s prioritization, how can we
  let others to successfully reproduce the experimental results in our
  papers if the partitioning results are uncertain and there may be no
  consistency even on divided datasets?
- **Precision**: Make the division result closest to the one that the
  given ratios expect. Multiply the total number with proportions as the
  desired division result, which can be considered as a vector, although
  its value may not be integers. Consider the actual result also a
  vector, which must be integers as result. We want to make the p-norm
  distance between desired vector and actual vector obtain minimum
  value.
- **Simplicity**: Simple and easy to use, with low complexity of the
  algorithm when implemented by computer.
- **Universality**: Can work in any situation where a list of elements
  is needed to be divided by meaningful proportions and is not limited
  to only divide machine learning datasets.

## Objectives and Requirements

According to the defined standard, give out objectives and requirements
described in mathematical terms:

- Problem conditions and statements:

  - Given a list $L$ of $N$ elements, i.e.,
    $L=[l_0,l_1,\ldots,l_{N-1}]$, where $N\in \mathbb{Z}^+$.

  - Given a list of proportions $r$, where
    $r=[r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1, n,n\in \mathbb{Z}^+, n \le N$.

  - Given a $p, p\in \mathbb{R}, p\ge 1$. Divide $L$ into $n$ parts by
    $r$.

  - Define result vector $y=[y_1,y_2,\ldots,y_n]\in \mathbb{N}^n$, where
    $y_i$ represents the element numbers in the $i$-th divided parts.

    {% note info %}

    The constraint $n\le N$ is needful to exclude many unrealistic
    scenarios. Because if $n>N$, there must be at least one divided part
    that possess no element, which is a meaningless thing since we
    cannot determine which part should have no element when treat each
    part equally without caring about its weighting. And even if we know
    in advance which part (has no element) to be excluded, we can modify
    the corresponding ratio $r_i$ in advance, instead of reserving it
    and increasing complexity.

    {% endnote %}

- Questions, requests and explanations:

  - Try to find a list
    $y^* = [y^*_1,y^*_2,\ldots,y^*_n]\in \mathbb{N}^n$, where
    $y^*\in Y^*=\{y|y=\mathop{\arg\min}\limits_{y\in \mathbb{N}^n,\|y\|_1=N}(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}\}$.

  - Avoid exhaustive enumeration as far as possible.

  - Ensure the determinism and non-ambiguity of $y^*$.

  - Any non-zero vector in $Y^*$ meets all stuff in the [Partition
    Standard](#Partition Standard).

    {% note info %}

    There may remain some confusion things that how the standard
    **non-omission**, **non-overlapping**, **Determinacy**, and
    **Simplicity** are met. We explain here:

    - The constraint $y\in \mathbb{N}^n,\|y\|_1=N$ are equivalent to the
      constraint $y\in \mathbb{N}^n,\sum_{i=1}^{n}y_i=N$.
    - As long as $y\in \mathbb{N}^n,\sum_{i=1}^{n}y_i=N$, the $L$ will
      be divided into exactly $n$ parts, naturally, there will be
      **no-omission** and **non-overlapping**.
    - It is difficult to find all the $y^*\in Y^*$, because there may be
      some equivalence $y^*$:
      - when
        $\exists (i,j)\in \{(i,j)|i\in [1,n], i\in \mathbb{Z}^+,j\in [1,n], j\in \mathbb{Z}^+,i<j\}, r_i=r_j$.
        In this case, maybe only exhaustive enumeration can find all the
        $y^*\in Y^*$. But when practicing, it is meaningless to look for
        all the solutions and the overhead of exhaustive enumeration
        should be avoided.
      - Whether or not there are multiple equivalent solutions, what we
        need is a definite solution generated by a fixed and simple
        pattern, instead of hanging multiple solutions that need to be
        determined by ourselves. So, we should design a pattern to make
        $y*$ deterministic and without ambiguity, reducing exhaustive
        enumeration as far as possible. Therefore, **Determinacy**, and
        **Simplicity** are met.

    {% endnote %}

## Algorithms

Design algorithms for the [Partition Standard](#Partition Standard).

- Get list $L=[l_0,l_1,\ldots,l_{N-1}]$. Let interval $[i_a,i_b]$, where
  \$i_ai_b,~i_a,i_b \$, represent a selected item set
  $\{l_{i_a},l_{i_{a+1}},\ldots,l_{i_b}\}$ from $L$.

- Calculate a $y^*=[y^*_1,y^*_2,\ldots,y^*_n]\in \mathbb{N}^n$ to meet
  the [Partition Standard](#Partition Standard), where
  $y^{*}_{i},i\in\{i|i\in [1,n],i\in \mathbb{Z}+\}$ represents the
  element numbers in the $i$-th divided parts.

- Find and apply algorithms to solve a Nonlinear Integer Programming
  (NIP) problem:

  $$
  \begin{equation}\label{NIP_problem}\tag{1}
  \begin{split}
    \text{known:}~~~~&n,N \in \mathbb{Z}^+, n \le N\\
    &p\in \mathbb{R},~p\ge 1\\
    &r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\\
    \text{minimize:}~~~~&(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}\\
    \text{subject to:}~~~~&~y = [y_1,y_2,\ldots,y_n]\in \mathbb{N}^n\\
    &\sum_{i=1}^{n}y_i=N\\
    \end{split}
  \end{equation}
  $$

  - It’s better to keep the time complexity of the algorithm not more
    than $O(n^2)$.

  - Ensure the determinism and non-ambiguity of $y*$ when this NIP
    problem’s solution is not unique.

- Divide $L$ into several interval, i.e.,
  $[0,y^*_1-1],[y^*_1,y^*_1+y^*_2-1],\ldots,[\sum_{i=1}^{n-1}y^*_i~,(\sum_{i=1}^{n}y^*_i)-1]$,
  to realize the dividing procedure obeying the above partition
  standard.

So, the key problem is to deal with the NIP problem
$\eqref{NIP_problem}$. In this article, we will analyze this problem and
post algorithms to solve it with some necessary proofs and explanations.

# Basic analysis

Usually, it is good to give the conclusion at the front of a blog post.
However, in this article, we will proceed along the normal lines of
problem solving. For better readability, the details of proof process
are put in the appendix. So, in this section, we will perform some basic
analysis first.

Generally, in NIP problem $\eqref{NIP_problem}$, try to find and confirm
the exact $y^*$, we may try $y^*_i=round(r_{i}N)$ . However, if we
calculate $[\sum_{i=1}^n round(r_{i}N)]-N$, it may not always be $0$,
i.e., the constraint $\sum_{i=1}^{n}y_i=N$ is not necessarily satisfied.
It is the hidden dilemma of this NIP issue, which resulting in our
inability to ensure that the division is non-overlapping and
non-omission. The subsequent analysis about domain and ranges will
explain it in more details.

## Domain and range analysis

To solve the NIP problem $\eqref{NIP_problem}$, we need to known why we
cannot just use $round(\cdot)$ function directly to divide elements in
$L$?

Firstly, we should give out a mathematical abstraction about
$round(\cdot)$ function. But, according to [IEEE
754](https://en.wikipedia.org/wiki/IEEE_754), there are many different
**rounding rules**, leading to different rounding behaviors on different
programing languages. See [appendix A.0](#A.0) for more details.

Thus, if in non-negative domain, the $round(\cdot)$ function’s
mathematical representation can be one of the following 3 forms:

- $$
  \begin{equation}\label{round_1}\tag{2}
  \forall x \in \mathbb{R}^+\cup\{0\},~round_1(x)=\begin{cases}
                  \lfloor x\rfloor, \text{if }x-\lfloor x\rfloor<0.5 \\
                  \lceil x\rceil, \text{if }x-\lfloor x\rfloor \ge 0.5
                  \end{cases}
  \end{equation}
  $$

- $$
  \begin{equation}\label{round_2}\tag{3}
  \forall x \in \mathbb{R}^+\cup\{0\},~round_2(x)=\begin{cases}
                  \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor \le 0.5 \\
                  \lceil x\rceil,\text{if }x-\lfloor x\rfloor > 0.5
                  \end{cases}
  \end{equation}
  $$

- $$
  \begin{equation}\label{round_3}\tag{4}
  \forall x \in \mathbb{R}^+\cup\{0\},~round_3(x)=\begin{cases}
                  \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor<0.5 \\
                  \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor=0.5,\lfloor x\rfloor \mod 2=0\\
                  \lceil x\rceil,\text{if }x-\lfloor x\rfloor=0.5,\lceil x\rceil\mod 2= 0\\
                  \lceil x\rceil,\text{if }x-\lfloor x\rfloor>0.5
                  \end{cases}
  \end{equation}
  $$

Then, let’s define and focus on a mapping function
$f(r,n,N):\{\mathbb{R}^n,\mathbb{Z}^+,\mathbb{Z}^+\}\rightarrow\{\mathbb{Z}\}$,

- $F_{r,n,N}=\{(r,n,N)| n\in \mathbb{Z}^+,N \in \mathbb{Z}^+, n \le N, r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$
  $$
  \begin{equation}\label{round}\tag{5}
  f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N, \text{where } (r,n,N) \in F_{r,n,N}
  \end{equation}
  $$

- $\forall n \in \mathbb{Z}^+$, define
  $F_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.

- $\forall n \in \mathbb{Z}^+$, define value range set
  $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}$.

- So, if choose $round_1(\cdot)$ as $\eqref{round_1}$, there is
  $f_1(r,n,N)$’s value range set
  $R(f_1,n)=\{f_1(r,n,N)|(r,N)\in F_{r,N}\}=\{x|x \in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.
  See [appendix A.1](#A.1) for analysis process.

- If choose $round_2(\cdot)$ as $\eqref{round_2}$, there is
  $f_2(r,n,N)$’s value range set
  $R(f_2,n)=\{f_2(r,n,N)|(r,N)\in F_{r,N}\}=\{x|x \in [-\frac{n}{2},\frac{n}{2}),x\in \mathbb{Z}\}$.
  See [appendix A.2](#A.2) for analysis process.

- If choose $round_3(\cdot)$ as $\eqref{round_3}$, there is
  $f_3(r,n,N)$’s value range set
  $R(f_3,n)=\{f_3(r,n,N)|(r,N)\in F_{r,N}\}=\{x|x \in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.
  See [appendix A.3](#A.3) for analysis process.

So, any $round(\cdot)$ function will result in a maximum difference of
about $0.5n$ in $\sum_{i=1}^{n}y_i$ to $N$. If back to original dividing
problem, there will be a difference up to $0.5n$ in the total number of
elements in divided parts to original total number. That is to say, up
to $0.5n$ elements may be missed. So, we cannot just use $round(\cdot)$
function directly to divide elements in $L$.

And, combine [appendix A.1](#A.1),[appendix A.2](#A.2) and [appendix
A.3](#A.3), we can find a conclusion about the function$\eqref{round}$
that:

$$
\begin{equation}\label{round_conclusion}\tag{6}
\begin{split}
\forall & (round(\cdot),n) \in \{(f,n)|f \in \{\eqref{round_1},\eqref{round_2},\eqref{round_3}\},n \in \mathbb{Z}^+\},\\
&\text{Define :} F_{r,N}=\{(r,N)|N\ge n, r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}\\
&\text{ there are:}\\
&~~(I)~\forall (r,N) \in F_{r,N}, \forall i \in \{i|i\in [1,n],i \in \mathbb{Z}\},  -0.5\le round(r_iN)-r_iN \le 0.5,\\
&~~(II)~\forall (r,N) \in F_{r,N},-0.5n\le [\sum_{i=1}^n round(r_{i}N)]-N \le 0.5n.\\
&~~(III)~\{x|x\in(-\frac{n}{2},\frac{n}{2}),x\in Z\} \subseteq \{[\sum_{i=1}^n round(r_{i}N)]-N| (r,N) \in F_{r,N}\}\\
&~~(IV)\text{ especially}, 0\in \{[\sum_{i=1}^n round(r_{i}N)]-N| (r,N) \in F_{r,N}\} \\
&~~(V)\exists y^*=[round(r_{1}N),round(r_{2}N),\ldots,round(r_{n}N)],\text{ where } \sum_{i=1}^{n}round(r_{i}N)=N
\end{split}
\end{equation}
$$

{% note primary %}

The above conclusion $\eqref{round_conclusion}$ is very important and
useful for further illustrations and proofs, even though it seems very
simple.

{% endnote %}

## If exactly non-overlapping and non-omission

Let’s back to the original NIP problem $\eqref{NIP_problem}$. The
previous section has shown 2 key points:

- \$round(){,,} \$ cannot ensure **non-overlapping** and
  **non-omission**.
- According the conclusion $\eqref{round_conclusion}$, there
  $\exists y^*=[round(r_{1}N),round(r_{2}N),\ldots,round(r_{n}N)]$,
  where \$ *{i=1}^{n}round(r*{i}N)=N\$, i.e., to meet
  $\sum_{i=1}^{n}y_i=N$

In this case, it can be proofed that, the
$y^*=[round(r_{1}N),round(r_{2}N),\ldots,round(r_{n}N)]$, where
$\sum_{i=1}^{n}round(r_{i}N)=N$, is a solution to the NIP problem
$\eqref{NIP_problem}$ . See [appendix A.4](#A.4) for the proof
procedures.

# Methods

In this section, we post 2 optional algorithms, with necessary proofs
and explanations of themself, to solve the NIP problem
$\eqref{NIP_problem}$.

## Solution 1, based on round() function

In the above sections, we can find that if
$y^*=[round(r_{1}N),round(r_{2}N),\ldots,round(r_{n}N)]$ meets the
constraint $\sum_{i=1}^{n}round(r_{i}N)=N$, it just become (one of) our
expired solution. So, we can express a method that based on
$round(\cdot)$ function as:

- Directly use $round(\cdot)$ function and calculate a
  $y=[round(r_{1}N),round(r_{2}N),\ldots,round(r_{n}N)]$ at first.

- Try to find and apply a modifying bias vector
  $b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n$ to $y$ to constitute the
  target $y^*=y+b$. So, the original NIP problem $\eqref{NIP_problem}$
  can be rewrite as:

  $$
  \begin{equation}\label{NIP_problem_round}\tag{7}
  \begin{split}
    \text{known:}~~~~&n,N \in \mathbb{Z}^+, n \le N\\
    &p\in \mathbb{R},~p\ge 1\\
    &r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\\
    &m=N-\sum_{i=1}^n round(r_iN)\\
    \text{minimize:}~~~~&(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\\
    \text{subject to:}~~~~~&b = [b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n\\
    &[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n\\
    &\sum_{i=1}^n b_i=m\\
    \end{split}
  \end{equation}
  $$

- Then, we can found the solution as:

  1.  Define
      $x=[x_1,x_2,\ldots,x_n],\forall i \in \{1,2,\ldots,n\},x_i = round(r_iN)-r_iN$.

  2.  Without loss of generality, let
      $-0.5\le~x_1\le x_2\le \ldots \le x_n \le 0.5$.

  3.  From the conclusion $\eqref{round_conclusion}$, there are
      $m \in \mathbb{Z},-\frac{n}{2}\le m\le\frac{n}{2}$.

  4.  It can be proofed (see [appendix A.6](#A.6)) that the following
      $b$ is one of the solutions of problem $\eqref{NIP_problem_round}$
      : $$
      \begin{equation}\label{solution_round}\tag{8}
      \begin{split}
      &\text{Let } b=[b_1,b_2,\ldots,b_n]\\
      &(1)~\text{If }m>0, \text{ then }\forall i \in \{i|i \in [1,|m|], i \in \mathbb{Z}^+\} b_i = 1, \forall j \in \{j|j \in [|m|+1,n], j \in \mathbb{Z}^+\} b_j = 0.\\
      &(2)~\text{If }m=0, \text{ then }\forall i \in \{i|i \in [1,n], i \in \mathbb{Z}^+\} b_i = 0.\\
      &(3)~\text{If }m<0, \text{ then }\forall i \in \{i|i \in [1,n-|m|], i \in \mathbb{Z}^+\} b_i = 0, \forall j \in \{j|j \in [n-|m|+1,n], j \in \mathbb{Z}^+\} b_j = -1.
      \end{split}
      \end{equation}
      $$

      {% note info %}

      When active, a stable sorting (see [appendix A.9](#A.9)) is needed
      to get the sorted state of $x$. Here the `stable` directly
      maintain the **determinism** and **non-ambiguity** when problem
      $\eqref{NIP_problem_round}$’s solution is not unique.

      A very simple way is sorting $x$ at first, recording the sorted
      mapping, taking the above procedures to get a result $b$, and
      re-mapping the $b$ back to the original order. This solution’s
      time complexity is $O(n^2)$. But in practice, there are many
      programming tricks that can go through the
      `sorting-and-re-mapping` process in more high-performance ways.

      And, any order of $x$ can have a corresponding solution as the
      above procedures. So, here the order of $x$ is not our key problem
      in this solution. Therefore, we default to
      $-0.5\le~x_1\le x_2\le \ldots \le x_n \le 0.5$ for simplicity.
      Thus the reason we use `without loss of generality` in the step
      `2`.

      {% endnote %}

- Back to the original problem, $\eqref{NIP_problem}$, there is
  $y^*=[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]$ that
  becomes one of the solution of problem $\eqref{NIP_problem}$.

## Solution 2, based on floor() function

Thanks to [@汪坤](https://www.zhihu.com/people/wang-kun-51-88)
[@WhoTFAmI](https://www.zhihu.com/people/WhoTFAmI) and
[@林凌](https://www.zhihu.com/people/lin-ling-43-27-55) for their ideas
and comments on the [知乎](https://www.zhihu.com/) problem
[如何不遗漏不重复地将列表元素按照指定比率划分？ - 知乎
(zhihu.com)](https://www.zhihu.com/question/543548568), which comes out
with this solution that based on floor() function.

Since the above solution 1 is based on $round(\cdot)$ function, whose
concrete form is not unique across different programming languages,
leading us to some additional troubles in the proof process. Although we
eventually overcome these troubles, we still hope to find a function
without ambiguity, i.e., $floor(\cdot)$ function, and express a method
that based on this function as:

- If in non-negative domain, the $floor(\cdot)$ function’s mathematical
  representation is as: $$
  \begin{equation}\tag{9}
  \forall x \in \mathbb{R}^+\cup\{0\}, floor(x)=\lfloor x\rfloor
  \end{equation}
  $$

- Directly use $floor(\cdot)$ function and calculate
  $y=[floor(r_{1}N),floor(r_{2}N),\ldots,floor(r_{n}N)]$ at first.

- The domain and range analysis are as:

  - Define and focus on a mapping function
    $f(r,n,N):\{\mathbb{R}^n,\mathbb{Z}^+,\mathbb{Z}^+\}\rightarrow\{\mathbb{Z}\}$,

  - $F_{r,n,N}=\{(r,n,N)| n\in \mathbb{Z}^+,N \in \mathbb{Z}^+, n \le N, r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$
    $$
    \begin{equation}\label{floor}\tag{10}
    f(r,n,N)=[\sum_{i=1}^n floor(r_{i}N)]-N, \text{where } (r,n,N) \in F_{r,n,N}
    \end{equation}
    $$

  - $\forall n \in \mathbb{Z}^+$, define
    $F_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.

  - $\forall n \in \mathbb{Z}^+$, define value range set
    $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}$.

  - There is $f(r,n,N)$’s value range set
    $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}=\{x|x \in (-n,0],x\in \mathbb{Z}\}$.
    See [appendix A.7](#A.7) for analysis process.

  - Also from [appendix A.7](#A.7), we can find a conclusion about the
    function $\eqref{floor}$ that: $$
    \begin{equation}\label{floor_conclusion}\tag{11}
    \begin{split}
      \forall & n \in \mathbb{Z}^+,\\
      &\text{Define :} F_{r,N}=\{(r,N)|N\ge n, r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}\\
      &\text{ there are:}\\
      &~~(I)~\forall (r,N) \in F_{r,N}, \forall i \in \{i|i\in [1,n],i \in \mathbb{Z}\},  -1 < floor(r_iN)-r_iN \le 0,\\
      &~~(II)~\forall (r,N) \in F_{r,N},-n < [\sum_{i=1}^n floor(r_{i}N)]-N \le 0.\\
      &~~(III)~\{x|x\in(-n,0],x\in Z\} \subseteq \{[\sum_{i=1}^n floor(r_{i}N)]-N| (r,N) \in F_{r,N}\}\\
      &~~(IV)\text{ especially}, 0\in \{[\sum_{i=1}^n floor(r_{i}N)]-N| (r,N) \in F_{r,N}\} \\
      &~~(V)\exists y^*=[floor(r_{1}N),floor(r_{2}N),\ldots,floor(r_{n}N)],\text{ where } \sum_{i=1}^{n}floor(r_{i}N)=N
      \end{split}
    \end{equation}
    $$

- Try to find and apply a modifying bias vector
  $b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n$ to $y$ to form the target
  $y^*=y+b$. So, the original NIP problem $\eqref{NIP_problem}$ can be
  rewrite as:

  $$
  \begin{equation}\label{NIP_problem_floor}\tag{12}
  \begin{split}
    \text{known:}~~~~&n,N \in \mathbb{Z}^+, n \le N\\
    &p\in \mathbb{R},~p\ge 1\\
    &r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\\
    &m=N-\sum_{i=1}^n floor(r_iN)\\
    \text{minimize:}~~~~&(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\\
    \text{subject to:}~~~~&b = [b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n\\
    &[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n\\
    &\sum_{i=1}^n b_i=m\\
    \end{split}
  \end{equation}
  $$

- Then, we can found the solution as:

  1.  Define
      $x=[x_1,x_2,\ldots,x_n],\forall i \in \{1,2,\ldots,n\},x_i = floor(r_iN)-r_iN$.

  2.  Without loss of generality, let
      $-1<~x_1\le x_2\le \ldots \le x_n \le 0$.

  3.  From the conclusion $\eqref{floor_conclusion}$, there are
      $m \in \mathbb{Z},0 \le m < n$.

  4.  It can be proofed (see [appendix A.8](#A.8)) that the following
      $b$ is one of the solutions of problem $\eqref{NIP_problem_floor}$
      : $$
      \begin{equation}\label{solution_floor}\tag{13}
      \begin{split}
       &\text{Let } b=[b_1,b_2,\ldots,b_n]\\
       &(1)~\text{If }m>0, \text{ then }\forall i \in \{i|i \in [1,|m|], i \in \mathbb{Z}^+\} b_i = 1, \forall j \in \{j|j \in [|m|+1,n], j \in \mathbb{Z}^+\} b_j = 0.\\
       &(2)~\text{If }m=0, \text{ then }\forall i \in \{i|i \in [1,n], i \in \mathbb{Z}^+\} b_i = 0.\\
       \end{split}
      \end{equation}
      $$

      {% note info %}

      When active, a stable sorting (see [appendix A.9](#A.9)) is needed
      to get the sorted state of $x$. Here the `stable` directly
      maintain the **determinism** and **non-ambiguity** when problem
      $\eqref{NIP_problem_floor}$’s solution is not unique.

      A very simple way is sorting $x$ at first, recording the sorted
      mapping, taking the above procedures to get a result $b$, and
      re-mapping the $b$ back to the original order. This solution’s
      time complexity is $O(n^2)$. But in practice, there are many
      programming tricks that can go through the
      `sorting-and-re-mapping` process in more high-performance ways.

      And, any order of $x$ can have a corresponding solution as the
      above procedures. So, here the order of $x$ is not our key problem
      in this solution. Therefore, we default to
      $-1<~x_1\le x_2\le \ldots \le x_n \le 0$ for simplicity. Thus the
      reason we use `without loss of generality` in the step `2`.

      {% endnote %}

- Back to the original problem, $\eqref{NIP_problem}$, there is
  $y^*=[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]$ that
  becomes one of the solution of problem $\eqref{NIP_problem}$.

## Compare solution 1 and solution 2

Since both solution 1 and solution 2 have been rigorously proven, for
further analysis, we only need to compare these two solutions in terms
of results instead of the terms of proof procedures. We should figure
out:

- Are solution 1 and solution 2 the same in results when back to the
  original NIP problem $\eqref{NIP_problem}$?

  Although solution 1 and solution 2 are methods that give out one of
  all solutions respectively with determinism and non-ambiguity, when
  back to he original NIP problem $\eqref{NIP_problem}$ by $y^*=y+b$,
  are these 2 solutions from solution 1 and solution 2 mathematically
  equivalent?

  From the procedures in [appendix A.10](#A.10), we have proofed that,
  when practice in a programming language, and the used sorting
  algorithm is stable [appendix A.9](#A.9):

  - If the $round(\cdot)$ is as $\eqref{round_1}$ or $\eqref{round_2}$,
    the results from solution $1$ solution $2$ will be the same one.

  - If the $round(\cdot)$ is as $\eqref{round_3}$, there is no guarantee
    that the results from solution $1$ solution $2$ are mathematically
    equivalent.

- Which one is better? We cannot figure out it.

  - Both the results from solution 1 and solution 2 have solved the
    original NIP problem $\eqref{NIP_problem}$, and obviously these 2
    methods (solutions) make the final algorithms meet the defined
    partition **standard**. So, in terms of results, there is no good or
    bad on these 2 solutions.
  - Additionally, the above content has proofed that the results from
    these 2 solutions are not always mathematically equivalent, which is
    to say, these two solutions have their own tendencies in terms of
    results, and both are reasonable and acceptable.
  - Both the algorithm process of solution 1 and solution 2 are in a
    suitable time and space complexity. We cannot assert which method
    (solution) is less complex because the real overhead will fluctuate
    between the upper and lower bounds of complexity depending on the
    input data. So, any attempt to evaluate the advantages and
    disadvantages of these 2 methods (solutions) by comparing the time
    and space complexity is not reasonable.

Therefore, both solution 1 and solution 2 are suitable, and we have
better to keep both of them simultaneously for users to choose.

## Is there any solution 3?

Apparently, there should at least be a solution 3 that based on
$ceil(\cdot)$ function.

However, we consider that, the solution based on $ceil(\cdot)$ function
is just a procedure of flipping number axis of the solution based on
$floor(\cdot)$ function. There is no need to discuss and post it again.

Moreover, we hold the view that this method (solution) is not very
intuitive and has a suspicion of imposing the beauty of mathematics and
algorithms.

So, we left it for readers. One can discuss and give the corresponding
results from $ceil(\cdot)$ function on their own.

# Coding implementation and testing

Testing is not to verify the theory, because the theory has already been
proven. Testing is to verify that the code is implemented correctly.

## Define the test part

We use [Python](https://www.python.org/) with
[`pytest`](https://docs.pytest.org/en/7.2.x/) to build the tests as:

``` python
#this file is ./data_dividing_test.py
import functools
import math
import pytest
import random
from templates.data_dividing import datas_dividing

def _gen_rate(rate_len,seed):
    random_func = random.Random(seed)
    rates = []
    rates_sum = 0.0
    for _ in range(rate_len-1):
        rates.append((1-rates_sum)*random_func.random())
        rates_sum += rates[-1]
    rates.append(1.0-rates_sum)
    return rates

def _diff_p_norm(seq1,seq2,ord):
    def mapping(x1,x2):
        return math.pow(abs(x1-x2),ord)
    return functools.reduce(lambda x,y:x+y,map(mapping,seq1,seq2))

def _tweak_i_j(numbers_list,seed):
    if len(numbers_list) <= 1:
        return numbers_list[:]
    numbers_list = numbers_list[:]
    random_func = random.Random(seed)
    while 1:
        i = random_func.randint(0,len(numbers_list)-1)
        if numbers_list[i]>=1:
            break
    while 1:
        j = random_func.randint(0,len(numbers_list)-1)
        if (numbers_list[j]) >= 0 and (j != i):
            break
    numbers_list[i] -= 1
    numbers_list[j] += 1
    return numbers_list

@pytest.mark.parametrize('mode',['round','floor'])
@pytest.mark.parametrize('data_len',[2,3,5,10,20,33,79,100,999,114514,142857])
@pytest.mark.parametrize('rate_len',[1,2,3,5,6,7,8,9])
@pytest.mark.parametrize('rate_seed',[0,1,2])
@pytest.mark.parametrize('tweak_seed',[0,1,2,3,4,5])
@pytest.mark.parametrize('p',[1,1.1,2,2.3,3])
def test_datas_dividing(mode,data_len,rate_len,rate_seed,tweak_seed,p):
    if data_len<rate_len:
        pass
    else:
        datas = list(range(data_len))
        rates = _gen_rate(rate_len,rate_seed)
        divided_datas = datas_dividing(datas,rates,seed=None,mode=mode)
        divided_datas_len = list(map(lambda x:len(x),divided_datas))
        targets = list(map(lambda r:r*len(datas),rates))
        diff_p_norm1 = _diff_p_norm(divided_datas_len,targets,ord=p)
        diff_p_norm2 = _diff_p_norm(_tweak_i_j(divided_datas_len,tweak_seed),targets,ord=p)
        assert diff_p_norm1<=diff_p_norm2
```

## Define the implementation part

We use [Python](https://www.python.org/) to build the implementation as:

``` python
#this file is ./datas_dividing.py
import random
import copy
import math
import operator
from typing import Literal,Any

def _get_dividing_nums(N:int,r:list[int|float],basic_func:Literal['round','floor']='round')->list[int]:
    """
    Divide `N` elements into len(`r`) parts, according to rate in `r`, 
    without repetition or omission(leaking),
    making the divided result closest to the scale determind by `r*N`.
    
    Args: 
        N: the total numbers of elements
        r: rates=[r_1,r_2,...,r_n] where r_i represent `i-th` divided part should have about r_i*N elements
        basic_func: `round` or `floor`, two different implementations (the same output), 
                    see https://little-train.com/posts/7d227c9.html
    Return:
        y = [y_1,y_2,...,y_n], list of integer datas, where y_i represts the `i-th` divided part's 
            element number, i.e., `dividing nums`
    Define a dividing error = (|y_1-r_1*N|^p+|y_2-r_2*N|^p+...+|y_n-r_n*N|^p)^(1/p),
        there should be 
        sum(y)==N and y = argmin(error)
    According to https://little-train.com/posts/7d227c9.html, the are 2 methods to calulate y
    At first, there should be:
        N>=len(r)>=1
        all(0<rate<=1 for rate in r)
        sum(r)==1.0 
    If basic_func == 'round'
        1. calculate `x` = [x_1,x_2,...,x_n] where x_i = round(r_i*N)-r_i*N
            calculate `y` = [y_1,y_2,...,y_n] where y_i = round(r_i*N) as the esitimated y
        2. get the sorted `ranks`(indices) of x by order from `small to large`,
            `ranks` = [rank_1,rank_2,...,rank_n]
            rank_i means if sort x, x[rank_i] is the i-th elements
        3. get `m` = N -(round(r_1*N)+round(r_2*N)+...+round(r_n*N))
        4. calculate a `bias_list` to modify x and get y
            if m>0 then `bias_list` = [1,1,...1,0,0,...,0], the first |m| elements are 1, the rest are 0 
            if m=0 then `bias_list` = [0,0,...,0]
            if m<0 then `bias_list` = [0,0,...,0,-1,-1,...,-1] , the last |m| elements are -1, the rest are 0 
        5. modify `y` = [y_1,y_2,...,y_n], where y[ranks[i]] = y[ranks[i]]+bias_list[i]
    if basic_func == 'floor':
        1. calculate `x` = [x_1,x_2,...,x_n] where x_i = floor(r_i*N)-r_i*N
            calculate `y` = [y_1,y_2,...,y_n] where y_i = round(r_i*N)
        2. get the sorted `ranks`(indices) of x by order from `small to large`,
            `ranks` = [rank_1,rank_2,...,rank_n]
            rank_i means if sort x, x[rank_i] is the i-th elements
        3. get `m` = N -(floor(r_1*N)+floor(r_2*N)+...+floor(r_n*N) )
        4. calculate a `bias_list` to modify x and get y
            if m>0 then `bias_list` = [1,1,...1,0,0,...,0], the first |m| elements are 1, the rest are 0 
            if m=0 then `bias_list` = [0,0,...,0]
        5. modify `y` = [y_1,y_2,...,y_n], where y[ranks[i]] = y[ranks[i]]+bias_list[i]
    Here the `y` is the target list of integer datas.
    Just slect y_i elements into the `i-th` divided part, we can divide N elements into n parts,
        without repetition or omission, achieving the smallest dividing error. 

    NOTE For determinacy, the sorting function used should be stable.
        Luckily, python's built-in sorted() function is a stable one,
        see https://docs.python.org/3/library/functions.html?highlight=sorted#sorted.

    """
    n = len(r)
    assert all(0<rate<=1 for rate in r)
    assert math.isclose(sum(r),1.0)
    assert 1 <= n <= N
    x = [] # buf for index and `estimated-N*rate`
    y = [] # estimated list, y:list[estimated]
    if basic_func == "round":
        for i,rate in enumerate(r):
            estimated = round(N*rate)
            x.append((i,estimated-N*rate))
            y.append(estimated)
        x.sort(key=lambda i_v:i_v[-1])
        ranks = [item[0] for item in x]
        m = N-sum(y)
        bias_list = [1]*abs(m)+[0]*(n-abs(m)) if m >= 0 else [0]*(n-abs(m))+[-1]*abs(m)
    elif basic_func == "floor":
        for i,rate in enumerate(r):
            estimated = math.floor(N*rate)
            x.append((i,estimated-N*rate))
            y.append(estimated)
        x.sort(key=lambda i_v:i_v[-1])
        ranks = [item[0] for item in x]
        m = N-sum(y)
        assert m >= 0
        bias_list = [1]*m+[0]*(n-m)
    else:
        raise ValueError(f"Unsupported mode:{basic_func}")
    # appliy bias for get each region's length, i.e., modify `y` (esitimated)
    for rank,bias in zip(ranks,bias_list):
        y[rank] += bias
    return y

def datas_dividing(datas:list[Any],rates:list[int|float],seed:int|None=None,mode:Literal['round','floor']='round')->tuple[list[Any],...]:
    """
    Dividing a list of elements into several parts without repetition or omission(leaking), 
        according to rates, to achieve the smallest dividing error as far as possible.
    Args:
        datas: input list of elements that need divide
        rates: list of rate numbers, represtent the dividing rate, rates[i] means the i+1 part will get about 
               len(datas)*rates[i] elements more details see function `_get_dividing_nums`'s arg `r`
        seed: if not `None`, an independent random shuffle with `seed` will be applied to realize random dividing
              NOTE: random is only for "which data in which parts", where the datas in a same parts should matain 
                    the original relative order, we matain this order by operating on indexes-level
        mode: `round` or `floor`, two different implementations (the same output)
               more details see function `_get_dividing_nums`'s arg `basic_func`
    Return:
        tuple of divided datas
        
    For safety, we only operate the copy of datas.
    For envinient, we operate on indexes-level insead of element-level.
        
    >>> datas_dividing(list(range(3)),[0.51,0.24,0.25])
    >>> ([0], [1], [2])
    """
    _datas = copy.deepcopy(datas)
    _datas_indexes = list(range(len(_datas)))
    if seed is not None:
        random_func = random.Random(seed)
        random_func.shuffle(_datas_indexes)
    dividing_nums = _get_dividing_nums(N=len(_datas_indexes),r=rates,basic_func=mode)
    indices_buf = [] # slices buf / indices buf
    begin = 0 
    for num in dividing_nums: # get indices
        indices_buf.append(slice(begin,begin+num,1))
        begin = begin+num
    out_buf = []
    for indices in indices_buf:
        sorted_indices = sorted(operator.getitem(_datas_indexes,indices)) # get selected indexes, sort it
        out_buf.append([_datas[i] for i in sorted_indices]) # get sorted elements by sorted indexes
    return tuple(out_buf)
```

## Testing

The testing commands is:

``` powershell
python -m pytest .\data_dividing_test.py 
```

And, the result is `Test passed completely` as:

<figure>
<img
src="https://raw.little-train.com/ed045e4dff371d09a090a0bf7bd60a91c0ec5e14119794e241da6598bef1a174.png"
alt="test-result" />
<figcaption aria-hidden="true">test-result</figcaption>
</figure>

# Summary

In this article, we have done the following things:

1.  From an operation that originated in machine learning, i.e.,
    dividing a dataset by a series of proportions, we have given out a
    partition **standard** to regulate a better and more appropriate
    rule when a list of elements is needed to be divided into $n$ parts
    by $n$ proportions (ratios).

2.  According to the defined standard, we have given out objectives and
    requirements described in mathematical terms.

3.  We have designed algorithms for the defined standard. Especially, we
    have extracted a NIP problem from it, which is the core target and
    problem of the algorithms.

4.  From two different ideas, one of which is **based on round()
    function** and another of which is **based on floor() function**, we
    have respectively designed a feasible sub-algorithms
    (operations/solutions) for them, to get a deterministic, unambiguous
    but not necessarily unique solution to this NIP problem , attached
    with rigorous proofs.

5.  We have compared the above 2 sub-algorithms (operations/solutions)
    and found the results of them are not always mathematically
    equivalent. Even though they are the reasonable and acceptable
    solutions, they have their own tendencies and not totally the same
    in some circumstance. We have better to reserve them simultaneously
    for users to choose.

6.  We have implemented and tested the above algorithms completely.

Other points:

- The **standard** and **method** posted in this article can help to
  partition a dataset by a series of proportions in machine learning,
  with **no-omission**, **non-overlapping**,
  **determinacy(reproducibility)**, **simplicity**, **precision** and
  **universality**. This method will be useful and exceptionally
  efficient when one is concerned about the determinism, non-omission
  and non-overlapping of a dataset partitioning. And the division metric
  based on `p-norm` is a reasonable indicator and with universality.

- If we want to realize random division, we should shuffle the original
  list first, which is not the key problem of this article.

- We have not carried out the idea **based on ceil() function**, since
  the sub-algorithms (operations/solutions) that **based on floor()
  function** is nearly identical to it, only the axis flipped.

- For determinacy in implementation, there should be stability in
  sorting function as [appendix A.9](#A.9). Luckily, the built-in
  `sorted()` function of [Python](https://www.python.org/), that we have
  used, is stable, see
  [here](https://docs.python.org/3/library/functions.html?highlight=sorted#sorted).

- The proof process in this article is complicated, where some lemmas
  are used to simplify the proof, but its logic is not confusing. The
  proofing procedure is very simple and smooth. It is a step-by-step
  progression, narrowing the feasible domain until achieving the target.

# Appendix

Details of some proofs for several issues are documented here.

## A.0

According to [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754), there
are five **rounding rules**:

> - Rounding to nearest
>
>   - **[Round to nearest, ties to
>     even](https://en.wikipedia.org/wiki/Rounding#Round_half_to_even)**
>     – rounds to the nearest value; if the number falls midway, it is
>     rounded to the nearest value with an even least significant
>     digit.[^1]
>
>   - **[Round to nearest, ties away from
>     zero](https://en.wikipedia.org/wiki/Rounding#Round_half_away_from_zero)**
>     (or **ties to away**) – rounds to the nearest value; if the number
>     falls midway, it is rounded to the nearest value above (for
>     positive numbers) or below (for negative numbers).[^2]
>
> - Directed roundings
>
>   - **Round toward 0** - directed rounding towards zero (also known as
>     *truncation*).[^3]
>
>   - **Round toward +∞** - directed rounding towards positive infinity
>     (also known as *rounding up* or *ceiling*).[^4]
>
>   - **Round toward −∞** - directed rounding towards negative infinity
>     (also known as *rounding down* or *floor*).[^5]

## A.1

- Given $round(x)$, where
  $\forall x \in \mathbb{R}^+\cup\{0\},~round(x)=\begin{cases} \lfloor x\rfloor, \text{if }x-\lfloor x\rfloor<0.5 \\ \lceil x\rceil, \text{if }x-\lfloor x\rfloor \ge 0.5 \end{cases}$,
  as $\eqref{round_1}$.
- Let
  $F_{r,n,N}=\{(r,n,N)|n \in\mathbb{Z}^+,N \in\mathbb{Z}^+, n \le N,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$
- $\forall n \in \mathbb{Z}^+$, let
  $F_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.
- Given
  $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N, \text{ where } (r,n,N) \in F_{r,n,N}$.
- $\forall n \in \mathbb{Z}^+$, try to find the value range set
  $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}$.

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
    $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}\subseteq \{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in F_{r,N}, \sum_{i=1}^{n}r_iN=N$.
    - So,
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n round(r_{i}N)-r_{i}N],\text{where } (r,N)\in F_{r,N}$.
    - According to `1`, there will be
      $\forall i \in \{i|i\in [1,n],i \in \mathbb{Z}\}, -0.5<round(r_{i}N)-r_{i}N\le 0.5$.
    - So,
      $\forall (r,N)\in F_{r,N}, -0.5n<\sum_{i=1}^n round(r_{i}N)-r_{i}N\le 0.5n$,
    - i.e., $\forall (r,N)\in F_{r,N}, -0.5n < f(r,n,N)\le 0.5n$.
    - And obviously, there is $f(r,n,N)\in \mathbb{Z}$,
    - so,
      $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\} \subseteq \{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$

    So, `2` is proofed.

3.  $\forall n \in \mathbb{Z}^+$,
    $\{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in F_{r,N}, \sum_{i=1}^{n}r_iN=N$.

    - So,
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n round(r_{i}N)-r_{i}N],\text{where } (r,N)\in F_{r,N}$.

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

        - Obviously, $(r,N)\in F_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=t*0+(k-t)*0.5+t*0+(k-t)*0.5\\
          &=k-t
          \end{split}
          $$

        - So, $\{x|x\in[0,k],x\in \mathbb{Z}\}\subseteq R(f,n)$

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

        - Obviously, $(r,N)\in F_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=t*(-0.5+\Delta)-t\Delta+(k-t-1)*0\\
          &~~~~+t*(-0.5+\Delta)-t\Delta+(k-t-1)*0\\
          &=-t
          \end{split}
          $$

        - So, $\{x|x\in[-k+1,-1],x\in \mathbb{Z}\}\subseteq R(f,n)$

        Therefore, there is
        $\{x|x\in[-k+1,k],x \in \mathbb{Z}\}\subseteq R(f,n)$.

      So,
      $\{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq R(f,n)$.

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

        - Obviously, $(r,N)\in F_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=0+(t-1)*0+(k-t)*0.5+(t-1)*0+(k-t)*0.5\\
          &=k-t
          \end{split}
          $$

        - So, $\{x|x\in[0,k-1],x\in \mathbb{Z}\}\subseteq R(f,n)$

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

        - Obviously, $(r,N)\in F_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=0+(t-1)*(-0.5+\Delta)-(t-1)\Delta+(k-t-1)*0\\
          &~~~~+(t-1)*(-0.5+\Delta)-(t-1)\Delta+(k-t-1)*0\\
          &=(t-1)*(-0.5+\Delta-\Delta-0.5+\Delta-\Delta)\\
          &=1-t
          \end{split}
          $$

        - So, $\{x|x\in[-k+1,-1],x\in \mathbb{Z}\}\subseteq R(f,n)$

        Therefore, there is
        $\{x|x\in[-k+1,k-1],x \in \mathbb{Z}\}\subseteq R(f,n)$.

      So,
      $\{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq R(f,n)$.

    So, `3` is proofed.

4.  Combine `2` and `3`:
    $\forall n \in \mathbb{Z}^+, R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}=\{x|x\in (-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.

## A.2

- Given $round(x)$, where
  $\forall x \in \mathbb{R}^+\cup\{0\},~round(x)=\begin{cases}
                  \lfloor x\rfloor, \text{if }x-\lfloor x\rfloor \le 0.5 \\
                  \lceil x\rceil, \text{if }x-\lfloor x\rfloor > 0.5
                  \end{cases}$, as $\eqref{round_2}$.
- Let
  $F_{r,n,N}=\{(r,n,N)|n \in\mathbb{Z}^+,N \in\mathbb{Z}^+, n \le N,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.
- $\forall n \in \mathbb{Z}^+$, let
  $F_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.
- Given
  $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N, \text{ where } (r,n,N) \in F_{r,n,N}$.
- $\forall n \in \mathbb{Z}^+$, try to find the value range set
  $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}$.

Take the following steps:

1.  $\forall x \in \mathbb{R}^+\cup\{0\}, -0.5 \le round(x)-x < 0.5$

    Proof:

    $\forall x \in \mathbb{R}^+\cup\{0\}$

    - If $x-\lfloor x\rfloor \le 0.5$, $round(x)-x=\lfloor x\rfloor-x$.
      - There are $\lfloor x\rfloor-x \ge -0.5$,
      - and, $\lfloor x\rfloor-x\le 0$.
      - So, $-0.5 \le round(x)-x \le 0$.
    - If $x-\lfloor x\rfloor > 0.5$, so $x\notin \mathbb{Z}$, so,
      $round(x)-x=\lceil x\rceil-x=\lfloor x\rfloor+1-x$.
      - There are $\lfloor x\rfloor+1-x< -0.5+1=0.5$,
      - and $\lceil x\rceil-x>0$.
      - So, $0 < round(x)-x< 0.5$.
    - So, combine the above 2 conditions, there is
      $-0.5 \le round(x)-x < 0.5$

    So, `1` is proofed.

2.  $\forall n \in \mathbb{Z}^+$,
    $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}\subseteq \{x|x\in [-\frac{n}{2},\frac{n}{2}),x\in \mathbb{Z}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in F_{r,N}, \sum_{i=1}^{n}r_iN=N$.
    - So,
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n round(r_{i}N)-r_{i}N],\text{where } (r,N)\in F_{r,N}$.
    - According to `1`, there will be
      $\forall i \in \{i|i\in [1,n],i \in \mathbb{Z}\}, -0.5\le round(r_{i}N)-r_{i}N< 0.5$.
    - So,
      $\forall (r,N)\in F_{r,N}, -0.5n \le \sum_{i=1}^n round(r_{i}N)-r_{i}N< 0.5n$,
    - i.e., $\forall (r,N)\in F_{r,N}, -0.5n \le f(r,n,N)< 0.5n$.
    - And obviously, there is $f(r,n,N)\in \mathbb{Z}$,
    - so,
      $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\} \subseteq \{x|x\in [-\frac{n}{2},\frac{n}{2}),x\in \mathbb{Z}\}$

    So, `2` is proofed.

3.  $\forall n \in \mathbb{Z}^+$,
    $\{x|x\in [-\frac{n}{2},\frac{n}{2}),x\in \mathbb{Z}\}\subseteq R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in F_{r,N}, \sum_{i=1}^{n}r_iN=N$.

    - So,
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n round(r_{i}N)-r_{i}N],\text{where } (r,N)\in F_{r,N}$.

    - So, if $n=2k, k\in \mathbb{Z}^+$, then,

      - $\forall t\in \{t | t\in[0,k], t\in \mathbb{Z}\}$, let: $$
        \begin{split}
        &N=2k\\
        &r=[r_1,r_2,\ldots,r_n],\\
        &~\forall i \in \{i|i\in[1,t],i\in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-1=0,\\
        &~\forall i \in \{i|i\in[t+1,k],i\in \mathbb{Z}\}, r_i=\frac{1.5}{N},round(r_iN)-r_iN=round(1.5)-1.5=-0.5,\\
        &~\forall i \in \{i|i\in[k+1,k+t],i\in \mathbb{Z}\} r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-1=0,\\
        &~\forall i \in \{i|i\in[k+t+1,2k],i\in \mathbb{Z}\}, r_i=\frac{0.5}{N},round(r_iN)-r_iN=round(0.5)-0.5=-0.5\\
        &~\sum_{i}^{n}r_i=\frac{t+1.5(k-t)+t+0.5(k-t)}{N}=1
        \end{split}
        $$

        - Obviously, $(r,N)\in F_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=t*0-(k-t)*0.5+t*0-(k-t)*0.5\\
          &=-k+t
          \end{split}
          $$

        - So, $\{x|x\in[-k,0],x\in \mathbb{Z}\}\subseteq R(f,n)$.

      - $\forall t\in \{t\in[1,k-1],t\in \mathbb{Z}\}, \exists \Delta \rightarrow 0^+$,
        let: $$
        \begin{split}
        &N=2k\\
        &r=[r_1,r_2,\ldots,r_n],\\
        &~\forall i \in \{i|i\in[1,t],i\in \mathbb{Z}\}, r_i=\frac{1.5+\Delta}{N},round(r_iN)-r_iN=round(1.5+\Delta)-(1.5+\Delta)=0.5-\Delta\\
        &~\forall i \in \{t+1\}, r_i=\frac{1-t\Delta}{N},round(r_iN)-r_iN=round(1-t\Delta)-(1-t\Delta)=t\Delta\\
        &~\forall i \in \{i|i\in[t+2,k],i\in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-(1)=0\\
        &~\forall i \in \{i|i\in[k+1,k+t],i\in \mathbb{Z}\} r_i=\frac{0.5+\Delta}{N},round(r_iN)-r_iN=round(0.5+\Delta)-(0.5+\Delta)=0.5_\Delta\\
        &~\forall i \in \{k+t+1\}, r_i=\frac{1-t\Delta}{N},round(r_iN)-r_iN=round(1-t\Delta)-(1-t\Delta)=t\Delta\\
        &~\forall i \in \{i|i\in[k+t+2,2k],i\in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-(1)=0\\
        &~\sum_{i}^{n}r_i=\frac{t(1.5+\Delta)+1-t\Delta+k-t-1+t(0.5+\Delta)+1-t\Delta+k-t-1}{N}\\
        &~=\frac{1.5t\cancel{+t\Delta}\cancel{+1}\cancel{-t\Delta}+k-t\cancel{-1}+0.5t\cancel{+t\Delta}\cancel{+1}\cancel{-t\Delta}+k-t\cancel{-1}}{N}=1
        \end{split}
        $$

        - Obviously, $(r,N)\in F_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=t*(0.5-\Delta)+t\Delta+(k-t-1)*0\\
          &~~~~+t*(0.5-\Delta)+t\Delta+(k-t-1)*0\\
          &=t
          \end{split}
          $$

        - So, $\{x|x\in[1,k-1],x\in \mathbb{Z}\}\subseteq R(f,n)$.

        Therefore, there is
        $\{x|x\in[-k,k-1],x \in \mathbb{Z}-k\}\subseteq R(f,n)$.

      So,
      $\{x|x\in [-\frac{n}{2},\frac{n}{2}),x\in \mathbb{Z}\}\subseteq R(f,n)$.

    - And, if $n=2k-1,k\in \mathbb{Z}^+$, then,

      - $\forall t\in \{t|t\in [1,k], t \in \mathbb{Z}\}$, let: $$
        \begin{split}
        &N=2k\\
        &r=[r_1,r_2,\ldots,r_n],\\
        &~~\forall i \in \{1\}, r_i=\frac{2}{N},round(r_iN)-r_iN=round(2)-2=0,\\
        &~\forall i \in \{i|i \in [2,t],i \in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-1=0,\\
        &~\forall i \in \{i|i \in [t+1,k],i \in \mathbb{Z}\}, r_i=\frac{1.5}{N},round(r_iN)-r_iN=round(1.5)-1.5=-0.5,\\
        &~\forall i \in \{i|i \in [k+1,k+t-1],i \in \mathbb{Z}\} r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-1=0,\\
        &~\forall i \in \{i|i \in [k+t,2k-1],i\in \mathbb{Z}\}, r_i=\frac{0.5}{N},round(r_iN)-r_iN=round(0.5)-0.5=-0.5\\
        &~\sum_{i}^{n}r_i=\frac{2+t-1+1.5(k-t)+t-1+0.5(k-t)}{N}=1
        \end{split}
        $$

        - Obviously, $(r,N)\in F_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=t0+(t-1)*0-(k-t)*0.5+(t-1)*0-(k-t)*0.5\\
          &=-k+t
          \end{split}
          $$

        - So, $\{x|x\in[-k+1,0],x\in \mathbb{Z}\}\subseteq R(f,n)$

      - $\forall t\in \{t|t\in [2,k], t \in \mathbb{Z}\}$, let: $$
        \begin{split}
        &N=2k\\
        &r=[r_1,r_2,\ldots,r_n],\\
        &~\forall i \in \{1\}, r_i=\frac{2}{N},round(r_iN)-r_iN=round(2)-2=0,\\
        &~\forall i \in \{i|i\in [2,t],i\in \mathbb{Z}\}, r_i=\frac{1.5+\Delta}{N},round(r_iN)-r_iN=round(1.5+\Delta)-(1.5+\Delta)=0.5-\Delta\\
        &~\forall i \in \{t+1\}, r_i=\frac{1-(t-1)\Delta}{N},round(r_iN)-r_iN=round(1-(t-1)\Delta)-(1-(t-1)\Delta)=(t-1)\Delta\\
        &~\forall i \in \{i|i\in [t+2,k],i\in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-(1)=0\\
        &~\forall i \in \{i|i\in [k+1,k+t-1],i\in \mathbb{Z}\} r_i=\frac{0.5+\Delta}{N},round(r_iN)-r_iN=round(0.5+\Delta)-(0.5+\Delta)=0.5-\Delta\\
        &~\forall i \in \{k+t\}, r_i=\frac{1-(t-1)\Delta}{N},round(r_iN)-r_iN=round(1-(t-1)\Delta)-(1-(t-1)\Delta)=(t-1)\Delta\\
        &~\forall i \in \{i|i\in [k+t+1,2k-1],i\in \mathbb{Z}\}, r_i=\frac{1}{N},round(r_iN)-r_iN=round(1)-(1)=0\\
        &~\sum_{i}^{n}r_i=\frac{2+(t-1)*(1.5+\Delta)+1-(t-1)\Delta+k-t-1+(t-1)*(0.5+\Delta)+1-(t-1)t\Delta+k-t-1}{N}\\
        &~=\frac{2+(t-1)*(2+2\Delta)+2-2(t-1)\Delta+2(k-t-1)}{N}=\frac{\cancel{2}\cancel{+2t}\cancel{-2}\cancel{+2t\Delta}\cancel{-2\Delta}\cancel{+2}\cancel{-2t\Delta}\cancel{+2\Delta}+2k\cancel{-2t}\cancel{-2}}{N}=1
        \end{split}
        $$

        - Obviously, $(r,N)\in F_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=0+(t-1)*(0.5-\Delta)+(t-1)\Delta+(k-t-1)*0\\
          &~~~~+(t-1)*(0.5-\Delta)+(t-1)\Delta+(k-t-1)*0\\
          &=(t-1)*(0.5-\Delta+\Delta+0.5-\Delta+\Delta)\\
          &=t-1
          \end{split}
          $$

        - So, $\{x|x\in[1,k-1],x\in \mathbb{Z}\}\subseteq R(f,n)$

        Therefore, there is
        $\{x|x\in[-k+1,k-1],x \in \mathbb{Z}\}\subseteq R(f,n)$.

      So,
      $\{x|x\in [-\frac{n}{2},\frac{n}{2}),x\in \mathbb{Z}\} \subseteq R(f,n)$.

    So, `3` is proofed.

4.  Combine `2` and `3`:
    $\forall n \in \mathbb{Z}^+, R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}=\{x|x\in [-\frac{n}{2},\frac{n}{2}),x\in \mathbb{Z}\}$

## A.3

- Given $round(x)$, where
  $\forall x \in \mathbb{R}^+\cup\{0\},round(x)=\begin{cases}
         \lfloor x\rfloor, &\text{if }&x-\lfloor x\rfloor<0.5 \\
         \lfloor x\rfloor,&\text{if }&x-\lfloor x\rfloor=0.5,\lfloor x\rfloor \mod 2=0\\
         \lceil x\rceil, &\text{if }&x-\lfloor x\rfloor=0.5,\lceil x\rceil\mod 2= 0\\
         \lceil x\rceil, &\text{if }&x-\lfloor x\rfloor>0.5
         \end{cases}$, as $\eqref{round_3}$.
- Let
  $F_{r,n,N}=\{(r,n,N)|n \in\mathbb{Z}^+,N \in\mathbb{Z}^+, n \le N,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.
- $\forall n \in \mathbb{Z}^+$, let
  $F_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.
- Given
  $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N, \text{ where } (r,n,N) \in F_{r,n,N}$.
- $\forall n \in \mathbb{Z}^+$, try to find the value range set
  $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}$.

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
    $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}\subseteq \{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in F_{r,N}, \sum_{i=1}^{n}r_iN=N$.
    - So,
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n round(r_{i}N)-r_{i}N],\text{where } (r,N)\in F_{r,N}$.
    - According to `1`, there will be
      $\forall i \in \{i|i\in [1,n],i \in \mathbb{Z}\}, -0.5\le round(r_{i}N)-r_{i}N\le 0.5$.
    - So,
      $\forall (r,N)\in F_{r,N}, -0.5n \le \sum_{i=1}^n round(r_{i}N)-r_{i}N \le 0.5n$,
    - i.e.,$\forall (r,N)\in F_{r,N}, -0.5n \le f(r,n,N)\le 0.5n$.
    - And obviously, there is $f(r,n,N)\in \mathbb{Z}$,
    - so,
      $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}\subseteq \{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.

    So, `2` is proofed.

3.  $\forall n \in \mathbb{Z}^+$,
    $\{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in F_{r,N}, \sum_{i=1}^{n}r_iN=N$.

    - So,
      $f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N=[\sum_{i=1}^n round(r_{i}N)-r_{i}N],\text{where } (r,N)\in F_{r,N}$.

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

        - Obviously, $(r,N)\in F_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=-0.5t+(2k-t)*0.5\\
          &=k-t
          \end{split}
          $$

        - So, $\{x|x\in[-k,k],x\in \mathbb{Z}\}\subseteq R(f,n)$.

      So,
      $\{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq R(f,n)$.

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

        - Obviously, $(r,N)\in F_{r,N}$.

        - Then $$
          \begin{split}
          f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)-r_{i}N]\\
          &=0-0.5(t-1)+(2k-1-t)*0.5\\
          &=-0.5t+0.5+k-0.5-0.5t\\
          &=k-t
          \end{split}
          $$

        - So, $\{x|x\in[-k+1,k-1],x\in \mathbb{Z}\}\subseteq R(f,n)$.

      So,
      $\{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}\subseteq R(f,n)$.

    So, `3` is proofed.

4.  Combine `2` and `3`:
    $\forall n \in \mathbb{Z}^+, R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}=\{x|x\in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$.

## A.4

- According to the NIP problem $\eqref{NIP_problem}$.

- Define solutions set and feasible set:

  - Define a set of known conditions: $$
    \begin{split}
    F_{p,n,r,N}=\{(p,n,r,N)|&n\in \mathbb{Z}^+,N \in \mathbb{Z}^+, n \le N,\\ &p\in \mathbb{R},~p\ge 1,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\},
    \end{split}
    $$

  - $\forall (p,n,r,N)\in F_{p,n,r,N}$, define feasible set
    $Y=\{y|y=\mathop{y\in \mathbb{N}^n,\|y\|_1=N}\}$,

  - and define solutions set
    $Y^*=\{y|y=\mathop{\arg\min}\limits_{y\in Y}(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}\}$.

  - Obviously, there is $Y^*\subseteq Y$.

- Try to proof: If
  $y^*=[round(r_{1}N),round(r_{2}N),\ldots,round(r_{n}N)]$, and
  $\sum_{i=1}^{n}round(r_{i}N)=N$, where
  $round(\cdot) \in \{\eqref{round_1},\eqref{round_2},\eqref{round_3}\}$,
  then there will be $y^*\in Y^*$.

- Proof:

  $\forall (p,n,r,N)\in F_{p,n,r,N}$

  - Obviously, there are $Y^*\ne \empty$ and $Y\ne \empty$.
  - According to $\eqref{round_conclusion}$,:
    - $\forall round(\cdot) \in \{\eqref{round_1},\eqref{round_2},\eqref{round_3}\}$,
    - $\exists y^*=[round(r_{1}N),round(r_{2}N),\ldots,round(r_{n}N)]$,
    - where $\sum_{i=1}^{n}round(r_{i}N)=N$
  - Obviously , $y^*\in Y$.
  - Assume $\exists~y\ne y^*,y\in Y$, that make
    $(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}<(\sum_{i=1}^n |y^*_i-r_{i}N |^{p})^{\frac{1}{p}}$.
  - Because $p\ge 1,p\in \mathbb{R}$, so,
    - $(I) \rightarrow$ there is
      $(\sum_{i=1}^n |y_i-r_{i}N |^{p})<(\sum_{i=1}^n |y^*_i-r_{i}N |^{p})$.
  - Define a mapping
    $f(i,\delta):\{\mathbb{Z}^+,\mathbb{Z}^-\cup\mathbb{Z}^+\}\rightarrow \mathbb{Z}^n$:
    - $\forall (i,\delta) \in \{(i,\delta)|i\in\mathbb{Z}^+,i\le n,\delta \in \mathbb{Z}^-\cup\mathbb{Z}^+\}$
    - \$f(i,)=\[f_1,f_2,,f_n\]^n, f_i=,x {x\|x,x, x i} f_x = 0 \$
  - So, $y$ can be rewritten by $y^*$ as:
    - $y = y^*+f(i_1,\delta_1)+f(i_2,\delta_2)+ \ldots +f(i_k,\delta_k)$,
    - where,
      $k \in \mathbb{Z}^+,1\le i_1<i_2< \ldots <i_k\le n, \delta_k\in \mathbb{Z}^-\cup\mathbb{Z}^+$
  - Without loss of generality, let $i_1=1,i_2=2,\ldots,i_k=k\le n$,
    - so, $\forall i \in \{1,2,\ldots,k\}$, there is
      $y_i=y^*_i+\delta_i$
    - and $i \in \{k+1,k+2,\ldots,n\}$, there is $y_i=y^*_i$
  - Substitute to $(I)$, therefore
    - $(II) \rightarrow$ there is
      $(\sum_{i=1}^k |y^*_i+\delta_i-r_{i}N |^{p})<(\sum_{i=1}^k |y^*_i-r_{i}N |^{p})$
  - Then, $\forall i \in \{1,2,\ldots,k\}$, there is:
    - $|y^*_i+\delta_i-r_{i}N|-|y^*_i-r_{i}N|=|round(r_{i}N)+\delta_i-r_{i}N|-|round(r_{i}N)-r_{i}N|$,
    - and from conclusion $\eqref{round_conclusion}$, there is,
    - $-0.5\le round(r_{i}N)-r_{i}N\le 0.5$
    - and also because $\delta_i\le -1~\or~ \delta_i\ge 1$,
    - so,
      $|round(r_{i}N)+\delta_i-r_{i}N|\ge 0.5\ge |round(r_{i}N)-r_{i}N|$
    - so, $|y^*_i+\delta_i-r_{i}N|-|y^*_i-r_{i}N|\ge 0$
    - i.e., $|y^*_i+\delta_i-r_{i}N |^{p}\ge |y^*_i-r_{i}N |^{p}$
    - therefore,
      $(\sum_{i=1}^k |y^*_i+\delta_i-r_{i}N |^{p})\ge(\sum_{i=1}^k |y^*_i-r_{i}N |^{p})$,
    - which is contradictory to $(II)$
  - So, the above assumption is not valid, i.e.,
    $\forall y\in \{y|y\in Y,y\ne y^*\}$,
    - there is
      $(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}\ge (\sum_{i=1}^n |y^*_i-r_{i}N |^{p})^{\frac{1}{p}}$
  - Therefore, the $y^*$ satisfies $y^*\in Y^*$

  Thus, the proof is complete.

## Lemma 1

$$
\begin{equation}\label{lemma_1}\tag{14}
\begin{split}
\text{Lemma:}\\
&\text{Given set }V_1,V_2,~\text{that }\empty \subsetneq V_1 \subseteq V_2,\\
&~~~~\text{and given set }U\subset V_2, \complement_{V_2}U.\\
&\text{If there is:}\\
&~~\text{Assume }U \cap V_1 \ne \empty,\\
&~~\text{it can be proofed that }U \cap V_1 \ne \empty \Rightarrow \complement_{V_2}U \cap V_1 \ne \empty.\\
&\text{Then:}\\
&~~\complement_{V_2}U \cap V_1 \ne \empty.\\
\text{Proof:}\\
&\text{If assumption }U \cap V_1 \ne \empty \text{ is valid},\\
&~~\text{then}, U \cap V_1 \ne \empty \Rightarrow \complement_{V_2}U \cap V_1 \ne \empty~\text{leads to }\complement_{V_2}U \cap V_1 \ne \empty.\\
&\text{If assumption }U \cap V_1 \ne \empty \text{ is not valid},\\
&~~\text{then}, U \cap V_1=\empty,\text{also leads to }\complement_{V_2}U \cap V_1 \ne \empty.\\
\end{split}
\end{equation}
$$

## Lemma 2

$$
\begin{equation}\label{lemma_2}\tag{15}
\begin{split}
\text{Lemma: }&\\
&\text{Given set }V_1,V_2,~\text{that }V_1 \subseteq V_2 \subseteq \mathbb{R}^n,\\
&~~~~\text{where }V_1=\{x|\mathop{\arg\min}\limits_{x\in V_2}f(x)\}\ne \empty,\\
&~~~~\text{and given set }U\subset V_2.\\
&\text{If: }U \cap V_1 \ne \empty.\\
&\text{Then: }\empty \ne \{x|\mathop{\arg\min}\limits_{x\in U}f(x)\}\subset V_1.\\
\text{Proof: }&\text{Omitted}\\
&\\
\end{split}
\end{equation}
$$

## Lemma 3

$$
\begin{equation}\label{lemma_3}\tag{16}
\begin{split}
\text{Lemma: }&\\
&\text{Given set }V_1,V_2,~\text{that }\empty~\ne V_1,V_1\subseteq V_2 \subseteq \mathbb{R}^n,\\
&~~~~\text{and given set }V^{*}_{1}=\{x|\mathop{\arg\min}\limits_{x\in V_1}f(x)\},\\
&~~~~\text{and given set }V^{*}_{2}=\{x|\mathop{\arg\min}\limits_{x\in V_2}f(x)\}.\\
&\text{If: }\exists x \in V^{*}_{2}, \text{and }x \in V_1.\\
&\text{Then: }x \in V^{*}_{1} \subseteq V^{*}_{2}.\\
\text{Proof: }&~\text{Omitted}\\
\end{split}
\end{equation}
$$

## A.5

$$
\begin{equation}\label{function_i}\tag{17}
\begin{split}
&\text{Define a helper function and elaboration some features (conclusions) of it.}\\
&\forall p\ge 1,~x \in [-0.5,0.5],~k\in \mathbb{N},\\
&~~~~I(k,x) =\begin{cases}
                |k+x|^{p}-|k+x-1|^{p},~k\ge 1, k \in \mathbb{Z},~x \in [-0.5,0.5]\\
                0,~k=0,~x \in [-0.5,0.5]\\
                |k+x|^{p}-|k+x+1|^{p},k\le -1, k \in \mathbb{Z},~x \in [-0.5,0.5]
                \end{cases}.\\
&\text{Since when }k\ge2,k \in \mathbb{Z},~x \in [-0.5,0.5],p\ge 1,\\
&~~~~\text{there is }\frac{\partial[(k+x)^{p}-(k+x-1)^{p}]}{\partial x}=p(k+x)^{p-1}-p(k+x-1)^{p-1}\ge 0,\\
&\text{and, when }k=1,k \in \mathbb{Z},~x \in [0,0.5],p\ge 1,\\
&~~~~\text{there is }\frac{\partial[(1+x)^{p}-(x)^{p}]}{\partial x}=p(1+x)^{p-1}-p(x)^{p-1}\ge 0,\\
&\text{and, when }k=1,k \in \mathbb{Z},~x \in [-0.5,0],p\ge 1,\\
&~~~~\text{there is }\frac{\partial[(1+x)^{p}-(-x)^{p}]}{\partial x}=p(1+x)^{p-1}+p(-x)^{p-1}\ge 0.\\
&\text{So, when }k\ge1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\ge 1,\\
&~~~~\text{the function }(|k+x|^{p}-|k+x-1|^{p})\text{is monotonically increasing W.R.T. x. }\\
&\text{So for all } x_1,x_2\in [-0.5,0.5],\\
&\text{when }k\ge2,\text{there is}\\
&~~~~I(k,x_1)-I(k-1,x_2)=|k+x_1|^{p}-|k+x_1-1|^{p}-(|k-1+x_2|^{p}-|k+x_2-2|^{p})\\
&~~~~\ge \min_{x_1}(|k+x_1|^{p}-|k+x_1-1|^{p})-\max_{x_2}(|k-1+x_2|^{p}-|k+x_2-2|^{p})\\
&~~~~= (|k-0.5|^{p}-|k-1.5|^{p})-(|k-0.5|^{p}-|k-1.5|^{p})=0,\\
&\text{and when }k=1,\text{there is}\\
&~~~~I(k,x_1)-I(k-1,x_2)=|1+x_1|^{p}-|x_1|^{p}-0\ge |1-0.5|^{p}-|-0.5|^{p}=0.\\
\\
&\text{Similarly, we can obtain:}\\
&\text{when }k\le -1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\ge 1,\\
&~~~~\text{the function }(|k+x|^{p}-|k+x+1|^{p})\text{is monotonically decreasing W.R.T. x. }\\
&\text{So for all } x_1,x_2\in [-0.5,0.5],\\
&\text{when }k\le-2,\text{there is}\\
&~~~~I(k,x_1)-I(k+1,x_2)\ge 0,\\
&\text{and when }k=-1,\text{there is}\\
&~~~~I(k,x_1)-I(k+1,x_2)=|-1+x_1|^{p}-|x_1|^{p}-0=|-x_1+1|^{p}-|-x_1|^{p}\ge 0.\\
\\
&\text{To conclude:}\\
&(1)\text{In the circumstance that }k \in \mathbb{Z},p\ge 1,\\
&~~~~\forall x_1,x_2,\ldots,x_{\infty}\in [-0.5,0.5], \text{there are,}\\
&~~~~~~~~0=I(0,x_1)\le I(-1,x_1)\le I(-2,x_2)\le\ldots \le I(-k_{\infty},x_{\infty}),\\
&~~~~~~~~\text{and }0=I(0,x_1)\le I(1,x_1)\le I(2,x_2)\le\ldots \le I(k_{\infty},x_{\infty})\\
&(2)\text{In the circumstance that }k\ge 1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\ge 1,\\
&~~~~\text{the function }I(k,x)~\text{is monotonically increasing W.R.T. x. }\\
&(3)\text{In the circumstance that }k\le-1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\ge 1,\\
&~~~~\text{the function }I(k,x)~\text{is monotonically decreasing W.R.T. x. }\\
\end{split}
\end{equation}
$$

## A.6

The proof procedure of solution 1 that based on `round()` function. For
better readability, we divide the proof process into several parts. The
first one is a pre-explanation, followed by assumptions and
extrapolations step by step, until the conclusion is reached.

1.  Preliminary illustrations:

    $$
    \begin{split}
     &\text{Basing on \eqref{NIP_problem_round} and \eqref{solution_round}, try to proof the correctness of \eqref{solution_round}}\\
     &\text{Known conditions:}\\
     &~~~~n,N \in \mathbb{Z}^+, n \le N\\
     &~~~~p\in \mathbb{R},~p\ge 1\\
     &~~~~r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\\
     &~~~~m=N-\sum_{i=1}^n round(r_iN)\\
     &~~~~m \in \mathbb{Z},\text{and }-\frac{n}{2}\le m\le\frac{n}{2} (\text{according to conclusioin~\eqref{round_conclusion}})\\
     &\text{Define }x=[x_1,x_2,\ldots,x_n], \forall i \in \{1,2,\ldots,n\},x_i = round(r_iN)-r_iN,\\
     &~~~~\text{also from conclusion }\eqref{round_conclusion}, \text{there is }-0.5\le round(r_iN)-r_iN \le 0.5.\\
     &\text{Without loss of generality, let }-0.5\le x_1\le x_2\le \ldots \le x_n \le 0.5.\\
     &\text{Define }B_f=\{b|b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m,[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n\}.\\
     &\text{Define }B^{'}_f=\{b|b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m\}.\\
     &\text{Define solutions set }B^{*}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B_f}(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}.\\
     &\text{Define solutions set }B^{*'}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B^{'}_f}(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}.\\
     &\text{If }m\ge 0, \text{then }\exists b=[m,0,\ldots,0]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m,\\
     &~~~~\text{that make }[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n,\\
     &~~~~\text{and if }m< 0,\\
     &~~~~\text{because }-\frac{n}{2}\le N-\sum_{i=1}^n round(r_iN)\le\frac{n}{2},\\
     &~~~~\text{so, } \sum_{i=1}^n round(r_iN)-\frac{n}{2}\le N\le\frac{n}{2}+\sum_{i=1}^n round(r_iN),\\
     &~~~~\text{therefore, }  \sum_{i=1}^n round(r_iN)\ge N-\frac{n}{2}\ge n-\frac{n}{2}=\frac{n}{2}\ge |m|,\\
     &~~~~\text{so, } \text{accordding to specific }round(r_iN)~\forall i \in \{1,2,\ldots,n\},\text{there still }\exists b \in \mathbb{Z}^n,\sum_{i=1}^n b_i=m.\\
     &~~~~\text{that make }[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n,\text{i.e., } \exists b\in B_f,\\
     &\text{Therefore, there is } \empty \ne B_f.\\
     &\text{So, there are }B_f\subseteq B^{'}_f, \empty \ne B^{*}_f\subseteq B_f,~\empty\ne B^{*'}_f \subseteq B^{'}_f.\\
     \end{split}
    $$

2.  Assumption 1:

    $$
    \begin{split}
     &\text{Assume that,}\exists b=[b_1,b_2,\ldots,b_n]\in B^{*'}_f \subseteq B^{'}_f,\\
     &~~~~\text{and simultaneously }b\in B_1= \{b|b=[b_1,b_2,\ldots,b_n] \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m, \exists s,t, b_s\ge 1,b_t\le -1\}\subseteq B^{'}_f.\\
     &\text{Without loss of generality, let }s<t.\\
     &\text{So,there is }b=[\ldots,b_s,\ldots,b_t,\ldots] \in B^{*'}_f \cap B_1.\\
     &\text{Define }b^{'}=[\ldots,b^{'}_s,\ldots.,b^{'}_t,\ldots]=[\ldots,b_s-1,\ldots,b_t+1,\ldots]\in B^{'}_f, \text{i.e.},~b^{'}_s=b_s-1,b^{'}_t=b_t+1,\\
     &\text{therefore, there is } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|round(r_sN)+b^{'}_s-r_{s}N |^{p}+|round(r_tN)+b^{'}_t-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|round(r_sN)+b_s-1-r_{s}N |^{p}+|round(r_tN)+b_t+1-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5, there is,}\\
     &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(b_s,round(r_sN)-r_{s}N)-I(b_t,round(r_tN)-r_{t}N)\\
     &\le -I(0,round(r_sN)-r_{s}N)-I(0,round(r_tN)-r_{t}N)\\
     &=0+0=0,\\
     &\text{so, } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}\le \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{i.e., } (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\le (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{so, } b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in B_1~\text{or }b^{'}\in\complement_{B^{'}_{f}}{B_1}.\text{If }b^{'}\in B_1,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure,and then get }b^{''}.\\
     &~~~~~~~~~~~\text{Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_{f}}{B_1},\text{i.e.},~\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty.\\
     &\text{Then, according to lemma $1$ \eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_f}B_1 \cap B^{*'}_f \ne \empty.\\
     \end{split}
    $$

3.  Assumption 2:

    $$
    \begin{split}
     &\text{Assume that,}\exists b=[b_1,b_2,\ldots,b_n]\in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \subseteq B^{'}_f,\\
     &~~~~\text{and simultaneously }b\in B_2= \{b|b=[b_1,b_2,\ldots,b_n],~ b_i \in \mathbb{Z},~\sum_{i=1}^n b_i = m, \exists s,~b_s\ge 2~or~\exists s,~b_s\le -2\}\subseteq B^{'}_f.\\
     &\text{Since }b \in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2,\\
     &\text{if }\exists~s,b_s\ge 2,then~\forall i \in \{1,2,\ldots,n\},\text{there is }b_{i}\ge 0,\\
     &\text{and according to~\eqref{round_conclusion},there is }0\le \sum_{i=1}^n b_i \le \frac{n}{2},\\
     &\text{therefore, }\exists t\ne s,\text{that }b_t=0.\\
     &\text{Without loss of generality, let }s<t.\\
     &\text{So,there is }b=[\ldots,b_s,\ldots,b_t,\ldots] \in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2.\\
     &\text{Define }b^{'}=[\ldots,b^{'}_s,\ldots,b^{'}_t,\ldots]=[\ldots,b_s-1,\ldots,b_t+1,\ldots]\in \complement_{B^{'}_f}B_1, \text{i.e.},~b^{'}_s=b_s-1,b^{'}_t=b_t+1=0,\\
     &\text{therefore, } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|round(r_sN)+b^{'}_s-r_{s}N |^{p}+|round(r_tN)+b^{'}_t-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|round(r_sN)+b_s-1-r_{s}N |^{p}+|round(r_tN)+1-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(b_s,round(r_sN)-r_{s}N)+I(1,round(r_tN)-r_{t}N)\\
     &=-[I(b_s,round(r_sN)-r_{s}N)-I(1,round(r_tN)-r_{t}N)]\\
     &\le0.\\
     &\text{Similarly, we can obtain,}\\
     &\text{If }\exists~s,b_s\le -2,\text{then for all } i \in \{1,2,\ldots,n\},\text{there is }b_{i}\le 0,\\
     &\text{therefore, }\exists t\ne s,\text{that }b_t=0.\\
     &\text{Without loss of generality, let }s<t.\\
     &\text{So,there is }b=[\ldots,b_s,\ldots,b_t,\ldots] \in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2.\\
     &\text{Define }b^{'}=[\ldots,b^{'}_s,\ldots,b^{'}_t,\ldots]=[\ldots,b_s+1,\ldots,b_t-1,\ldots]\in \complement_{B^{'}_f}B_1,\text{i.e.},~b^{'}_s=b_s+1,b^{'}_t=b_t-1=-1,\\
     &\text{therefore, } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|round(r_sN)+b^{'}_s-r_{s}N |^{p}+|round(r_tN)+b^{'}_t-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|round(r_sN)+b_s+1-r_{s}N |^{p}+|round(r_tN)-1-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(b_s,round(r_sN)-r_{s}N)+I(-1,round(r_tN)-r_{t}N)\\
     &=-[I(b_s,round(r_sN)-r_{s}N)-I(-1,round(r_tN)-r_{t}N)]\\
     &\le0.\\
     &\text{So, regardless of whether }\exists~s,b_s \ge2~\text{or }\exists~s,b_s \le -2,\\
     &~~~~\text{there is }\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}\le \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{so, } (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\le (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{therefore, } b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in \complement_{B^{'}_f}B_1\cap B_2~\text{or }b^{'}\in\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}. \text{If }b^{'}\in \complement_{B^{'}_f}B_1\cap B_2,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure}\\
     &~~~~~~~~~~~\text{and then get }b^{''}.\text{Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2},\text{i.e.},~\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \ne \empty.\\
     &\text{Then, according to lemma $1$\eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \ne \empty.\\
     \end{split}
    $$

4.  Assumption 3:

    $$
    \begin{split}
     &\text{Assume that,} \exists b=[b_1,b_2,\ldots,b_n]\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f\subseteq B^{'}_{f},\text{and simultaneously}\\
     &~~~~b\in B_3= \{b|b=[b_1,b_2,\ldots,b_n],~ b_i \in \mathbb{Z},~\sum_{i=1}^n b_i = m, \exists s,t,~0\le b_s<b_t,x_s<x_t~or~\exists s,t,b_s<b_t\le 0,x_s<x_t\}\subseteq B^{'}_{f},\\
     &\text{and because} -0.5\le x_1\le x_2\le \ldots \le x_n \le 0.5,\\
     &\text{so, there must be }s<t.\\
     &\text{Since }b \in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_3,\\
     &\text{if }\exists~0\le b_s<b_t,x_s<x_t,then~\forall i \in \{1,2,\ldots,n\},\text{there is }b_{i}\in \{0,1\},\\
     &\text{therefore, }b_s=0, b_t = 1.\\
     &\text{So, there is } b=[\ldots,b_s,\ldots,b_t,\ldots] \in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_3.\\
     &\text{Define }b^{'}=[\ldots,b^{'}_s,\ldots,b^{'}_t,\ldots]=[\ldots,b_s+1,\ldots,b_t-1,\ldots]\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1,\text{i.e.},~b^{'}_s=b_s+1=1,b^{'}_t=b_t-1=0,\\
     &\text{therefore, } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|round(r_sN)+b^{'}_s-r_{s}N |^{p}+|round(r_tN)+b^{'}_t-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|round(r_sN)+1-r_{s}N |^{p}+|round(r_tN)-r_{t}N |^{p}-|round(r_sN)-r_{s}N |^{p}-|round(r_tN)+1-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=I(1,round(r_sN)-r_{s}N)-I(1,round(r_tN)-r_{t}N)\\
     &=I(1,x_s)-I(1,x_t)\\
     &\le 0, \text{since }x_s<x_t.\\
     &\text{Similarly, we can obtain,}\\
     &\text{if }\exists~0\le b_s<b_t,x_s<x_t,\text{then }\forall i \in \{1,2,\ldots,n\},\text{there is }b_{i}\in \{0,-1\},\\
     &\text{so, }b_s=-1, b_t = 0.\\
     &\text{So, there is }b=[\ldots,b_s,\ldots,b_t,\ldots] \in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_3.\\
     &\text{Define }b^{'}=[\ldots,b^{'}_s,\ldots,b^{'}_t,\ldots]=[\ldots,b_s+1,\ldots,b_t-1,\ldots]\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1,\text{i.e.},~b^{'}_s=b_s+1=0,b^{'}_t=b_t-1=-1,\\
     &\text{therefore, } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=|round(r_sN)+b^{'}_s-r_{s}N |^{p}+|round(r_tN)+b^{'}_t-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}\\
     &=|round(r_sN)-r_{s}N |^{p}+|round(r_tN)-1-r_{t}N |^{p}-|round(r_sN)-1-r_{s}N |^{p}-|round(r_tN)-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(-1,round(r_sN)-r_{s}N)+I(-1,round(r_tN)-r_{t}N)\\
     &=-I(-1,x_s)+I(-1,x_t)\\
     &\le 0, \text{since }x_s<x_t.\\
     &\text{So, regardless of whether }\exists~0\le b_s<b_t,x_s<x_t~or~\exists~0\le b_s<b_t,x_s<x_t,\\
     &~~~~\text{there is }\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}\le \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{so, } (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\le (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{therefore, } b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap B_3~\text{or }b^{'}\in\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3}.\\
     &~~~~~~~~~~~\text{If }b^{'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap B_3,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure}\\
     &~~~~~~~~~~~\text{and then get }b^{''}.\text{Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3},\text{i.e.},~\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3}\cap B^{*'}_f \ne \empty.\\
     &\text{Then, according to lemma $1$ \eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_f}B_2\cap\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty.\\
     \end{split}
    $$

5.  Consider a special $b$

    $$
    \begin{split}
     &\text{Define: }B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1.\\
     &\text{Konwn: }x = [x_1,x_2,\ldots,x_n], x_i = round(r_iN)-r_iN,-0.5\le x_1\le x_2\le \ldots \le x_n \le 0.5.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n round(r_iN), \text{and from conclusion }\eqref{round_conclusion}, \text{there are }m \in \mathbb{Z},\text{and }-\frac{n}{2}\le m\le\frac{n}{2}.\\ 
     &~~~~(1)~\text{If }m>0, \text{then let }b=[b_1,b_2,\ldots,b_n]=[1,1,\ldots,1,0,0,\ldots,0],\\
     &~~~~~~~~\text{whose the first $|m|$ elements are $ 1$ and the rest are $0$}.\\
     &~~~~(2)~\text{If }m=0, \text{then let }b=[b_1,b_2,\ldots,b_n]=[0,0,\ldots,0].\\
     &~~~~(3)~\text{If }m<0, \text{then let }b=[b_1,b_2,\ldots,b_n]=[0,0,\ldots,-1,-1,\ldots,-1],\\
     &~~~~~~~~\text{whose the last $|m|$ elements are $-1$ and the rest are $0$}.\\
     &\text{Obviously},~b\in B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1.\\
     \end{split}
    $$

6.  Assumption 4 that proof the above $b\in B^{*'}_{f}$:

    $$
    \begin{split}
     &\text{Assume that,}\exists b^{'}=[b^{'}_1,b^{'}_2,\ldots,b^{'}_n]\in B_t=\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1, b^{'}\ne b,\\
     &~~~~\text{that make} (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}<(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}.\\
     &\text{Define }f:\{\mathbb{Z}^+,\mathbb{Z}^-\cup\mathbb{Z}^+\}\rightarrow \mathbb{Z}^n,\\
     &~~~~\forall i,v~~i\in\mathbb{Z}^+,i\le n, v\in \mathbb{Z}^-\cup\mathbb{Z}^+,\\
     &~~~~f(i,v)=[0,0,\ldots,0,v,0,\ldots,0]\in \mathbb{N},\\
     &~~~~\text{represents a vector whose the i-th element is $v$ and other elements are all }0.\\
     \text{If }&m>0,\\
     &\text{because }p\ge 1,p\in \mathbb{R},\\
     &\text{therefore }(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})<(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}),\\
     &\text{and because }m>0,\\
     &\text{so }b = [1,1,\ldots,1,0,0,\ldots,0],\\
     &~~~~\text{whose the first $|m|$ elements are $1$ and the rest are }0.\\
     &\text{Without loss of generality, let}\\
     &~~~~b^{'} = b+f(s_1,-1)+f(s_2,-1)+\ldots+f(s_k,-1)+f(t_1,1)+f(t_2,1)+\ldots+f(t_k,1),\\
     &~~~~\text{where }k \in \mathbb{Z}^+~1\le s_1<s_2<\ldots<s_k\le m<t_1<t_2<\ldots<t_k\le n,\\
     &~~~~\text{and }\forall i\in \{1,2,\ldots,k\}~s_i,t_i \in \mathbb{Z},\\
     &\text{therefore for all }i\in \{1,2,\ldots,k\},\text{there are }b_{s_i}=1,b_{t_i}=0,b^{'}_{s_i}=b_{s_i}-1=0,b^{'}_{t_i}=b_{t_i}+1=1,\\
     &\text{so, }(\sum_{i=1}^k |round(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p})\\
     &~~~~<(\sum_{i=1}^k |round(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p}),\\
     (I)\rightarrow &\text{therefore}(\sum_{i=1}^k |round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)+1-r_{t_i}N |^{p})\\
     &~~~~~~~~<(\sum_{i=1}^k |round(r_{s_i}N)+1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p}),\\
     &\text{and because for all }i\in \{1,2,\ldots,k\},\\
     & |round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)+1-r_{t_i}N |^{p}-|round(r_{s_i}N)+1-r_{s_i}N |^{p}-|round(r_{t_i}N)-r_{t_i}N |^{p}\\
     &=-I(1,round(r_{s_i}N)-r_{s_i}N)+I(1,round(r_{t_i}N)-r_{t_i}N)\\
     &=-I(1,x_{s_i})+I(1,x_{t_i})\\
     &\ge 0,\text{since }b\in \complement_{B^{'}_{f}}{B_3},b_{s_i}>b_{t_i}, x_{s_i}\le x_{t_i},\\
     &\text{therefore }(\sum_{i=1}^k |round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)+1-r_{t_i}N |^{p})\\
     &~~~~~~~~\ge (\sum_{i=1}^k |round(r_{s_i}N)+1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p}),\\
     &\text{which is contradictory to (I), so the above assumption is not valid.}\\
     \text{If }&m=0:\\
     &\text{Obviously}, B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1~\text{is a single-element set, there is }\nexists b^{'}\ne b, \text{that }b^{'}\in B_t,\\
     &\text{so the above assumption is not valid.}\\
     \text{If }&m<0:\\
     &\text{because }p\ge 1,p\in \mathbb{R},\\
     &\text{so }(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})<(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}),\\
     &b = [0,0,\ldots,-1,-1,\ldots,-1],\\
     &~~~~\text{whose the last $|m|$ elements are $-1$, the rest are }0.\\
     &\text{Without loss of generality, let},\\
     &~~~~b^{'} = b+f(s_1,-1)+f(s_2,-1)+\ldots+f(s_k,-1)+f(t_1,1)+f(t_2,1)+\ldots+f(t_k,1),\\
     &~~~~\text{where }k \in \mathbb{Z}^+~1\le s_1<s_2<\ldots<s_k<n-|m|+1\le t_1<t_2<\ldots<t_k\le n,\\
     &~~~~\text{and }\forall i\in \{1,2,\ldots,k\}~s_i,t_i \in \mathbb{Z},\\
     &\text{therefore for all }i\in \{1,2,\ldots,k\},\text{there are }b_{s_i}=0,b_{t_i}=-1,b^{'}_{s_i}=b_{s_i}-1=-1,b^{'}_{t_i}=b_{t_i}+1=0,\\
     &\text{so } (\sum_{i=1}^k |round(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p})\\
     &~~~~<(\sum_{i=1}^k |round(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p}),\\
     (II)\rightarrow &\text{therefore} (\sum_{i=1}^k |round(r_{s_i}N)-1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p})\\
     &~~~~~~~~<(\sum_{i=1}^k |round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)-1-r_{t_i}N |^{p}),\\
     &\text{and because for all }i\in \{1,2,\ldots,k\}, \text{there is }\\
     &|round(r_{s_i}N)-1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p}-|round(r_{s_i}N)-r_{s_i}N |^{p}-|round(r_{t_i}N)-1-r_{t_i}N |^{p}\\
     &=I(-1,round(r_{s_i}N)-r_{s_i}N)-I(-1,round(r_{t_i}N)-r_{t_i}N)\\
     &=I(-1,x_{s_i})-I(-1,x_{t_i})\\
     &\ge 0,\text{since }b\in \complement_{B^{'}_{f}}{B_3},b_{s_i}>b_{t_i}, x_{s_i}\le x_{t_i},\\
     &\text{therefore }(\sum_{i=1}^k |round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)+1-r_{t_i}N |^{p})\\
     &~~~~\ge (\sum_{i=1}^k |round(r_{s_i}N)+1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p}),\\
     &\text{which is contradictory to (II), so the above assumption is not valid.}\\
     \text{So},&~\text{regardless of the value of $m$, the above assumption is always not valid, i.e.,}\\
     &\text{there must be}\\
     &b\in \{b|b=\mathop{\arg\min}\limits_{b\in B_t}(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\},\\
     &\text{also because } B_t \cap B^{*'}_f \ne \empty \text{ and } B_t \subseteq B^{'}_f,\\
     &\text{and according to \eqref{lemma_2}, there must be}\\
     &\empty \ne \{b|b=\mathop{\arg\min}\limits_{b\in B_t}(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\} \subseteq B^{*'}_f,\\
     &\text{therefore }b\in B^{*'}_f.
     \end{split}
    $$

7.  Consider if the specific $b$ satisfies that
    $b\in B_f \subseteq B^{'}_f$:

    $$
    \begin{split}
     &\text{Konwn: }x = [x_1,x_2,\ldots,x_n], x_i = round(r_iN)-r_iN,-0.5\le x_1\le x_2\le \ldots \le x_n \le 0.5.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n round(r_iN), \text{and from conclusion }\eqref{round_conclusion}, \text{there are }m \in \mathbb{Z},\text{and }-\frac{n}{2}\le m\le\frac{n}{2}.\\ 
     &\text{Try to proof the above $b$ satisfies that $b\in B_f \subseteq B^{'}_f$, i.e.,}\\
     &~~~~\text{try to proof the above $b$ satisfies }[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n\\
     &(1)\text{If }m>0, \text{then }b=[b_1,b_2,\ldots,b_n]=[1,1,\ldots,1,0,0,\ldots,0],\\
     &~~~~\text{whose the first $|m|$ elements are $1$ and the rest are }0,\\
     &~~~~\text{then the constraint }[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n \text{is valid.}\\
     &(2)\text{If }m=0, \text{then }b=[b_1,b_2,\ldots,b_n]=[0,0,\ldots,0],\\
     &~~~~\text{then the constraint }[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n \text{is still valid.}\\
     &(3)\text{If }m<0, \text{then }b=[b_1,b_2,\ldots,b_n]=[0,0,\ldots,-1,-1,\ldots,-1],\\
     &~~~~~~~~\text{whose the last $|m|$ elements are $-1$ and the rest are }0,\\
     &~~~~\text{and because }b\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m,\\
     &~~~~\text{so }m\in \mathbb{Z}^-,\\
     &~~~~\text{also because }\sum_{i=1}^n x_i=-m,-0.5\le x_1\le x_2\le \ldots \le x_n \le 0.5,\\
     &~~~~\text{therefore, }\text{there must be for all }i \in \{n-2|m|+1,n-2|m|+2,\ldots,n\}~x_{i}\ge 0,\\
     &~~~~\text{i.e., there must be for all}i \in \{n-2|m|+1,n-2|m|+2,\ldots,n\}~round(r_iN)\ge 1,\\
     &~~~~\text{so for all }i \in \{1,2,\ldots,n-2|m|\}~round(r_iN)+b_i=round(r_iN)+0=round(r_iN),\\
     &~~~~~\text{and for all }i \in \{n-2|m|+1,n-2|m|+2,\ldots,n-|m|\}~round(r_iN)+b_i=round(r_iN)+0=round(r_iN),\\
     &~~~~~\text{and for all }i \in \{n-|m|+1,n-|m|+2,\ldots,n\}~round(r_iN)+b_i\ge 1-1 = 0,\\
     &~~~~\text{therefore, }\text{the constraint }[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n~\text{is still valid.}\\
     \text{So},&~\text{regardless of the value of }m~,\\
     &\text{the above $b$ always satisfies }[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n,\text{i.e.},\\
     &\text{the above $b$ satisfies that }b\in B_f \subseteq B^{'}_f.\\
     \end{split}
    $$

8.  Finally

    $$
    \begin{split}
     &\text{Konwn: }x = [x_1,x_2,\ldots,x_n], x_i = round(r_iN)-r_iN,-0.5\le x_1\le x_2\le \ldots \le x_n \le 0.5.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n round(r_iN), \text{and from conclusion \eqref{round_conclusion}, there are }m \in \mathbb{Z},\text{and }-\frac{n}{2}\le m\le\frac{n}{2}.\\ 
     &\text{Since the above vector $b$,i.e.,}\\
     &~~~~(1)~\text{if }m>0, \text{then }b=[b_1,b_2,\ldots,b_n]=[1,1,\ldots,1,0,0,\ldots,0],\\
     &~~~~~~~~\text{whose the first $|m|$ elements are $ 1$ and the rest are }0,\\
     &~~~~(2)~\text{if }m=0, \text{then }b=[b_1,b_2,\ldots,b_n]=[0,0,\ldots,0],\\
     &~~~~(3)~\text{if }m<0, \text{then }b=[b_1,b_2,\ldots,b_n]=[0,0,\ldots,-1,-1,\ldots,-1],\\
     &~~~~~~~~\text{whose the last $|m|$ elements are $-1$ and the rest are }0,\\
     &~~~~\text{that satisfies }b\in B^{*'}_f~\text{and }b\in B_f \subseteq B^{'}_f.\\
     &\text{Then, according to \eqref{lemma_3}, the final conclusion can be drawn as}\\
     &~~~~b\in B^{*}_f \subseteq B^{*'}_f.\\
     \end{split}
    $$

Along the above 8 points, the
[Solution-1](#Solution 1, based on round() function) is proofed totally.

## A.7

- Given
  $floor(x), \text{where} \forall x \in \mathbb{R}^+\cup\{0\},~floor(x)=\lfloor x\rfloor$.
- Let
  $F_{r,n,N}=\{(r,n,N)|n \in\mathbb{Z}^+,N \in\mathbb{Z}^+, n \le N,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$
- $\forall n \in \mathbb{Z}^+$, let
  $F_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.
- Given
  $f(r,n,N)=[\sum_{i=1}^n floor(r_{i}N)]-N, \text{ where } (r,n,N) \in F_{r,n,N}$.
- $\forall n \in \mathbb{Z}^+$, try to find the value range set
  $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}$.

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
    $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}\subseteq \{x|x\in (-n,0],x\in \mathbb{Z}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in F_{r,N}, \sum_{i=1}^{n}r_iN=N$
    - So,
      $f(r,n,N)=[\sum_{i=1}^n floor(r_{i}N)]-N=[\sum_{i=1}^n floor(r_{i}N)-r_{i}N],\text{where } (r,N)\in F_{r,N}$
    - According to `1`, there will be
      $\forall i \in \{i|i\in [1,n],i \in \mathbb{Z}\}, -1 < floor(r_{i}N)-r_{i}N\le 0$.
    - So,
      $\forall (r,N)\in F_{r,N}, -n < \sum_{i=1}^n floor(r_{i}N)-r_{i}N \le 0$,
    - i.e., $\forall (r,N)\in F_{r,N}, -n < f(r,n,N)\le 0$
    - And obviously, there is $f(r,n,N)\in \mathbb{Z}$,
    - so,
      $R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}\subseteq \{x|x\in (-n,0],x\in \mathbb{Z}\}$.

    So, `2` is proofed.

3.  $\forall n \in \mathbb{Z}^+$,
    $\{x|x \in (-n,0],x\in \mathbb{Z}\}\subseteq R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}$.

    Proof:

    $\forall n \in \mathbb{Z}^+$

    - Obviously, $\forall (r,N)\in F_{r,N}, \sum_{i=1}^{n}r_iN=N$.

    - So,
      $f(r,n,N)=[\sum_{i=1}^n floor(r_{i}N)]-N=[\sum_{i=1}^n floor(r_{i}N)-r_{i}N],\text{where } (r,N)\in F_{r,N}$.

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

      - Obviously, $(r,N)\in F_{r,N}$.

      - Then $$
        \begin{split}
        f(r,n,N)&=[\sum_{i=1}^n floor(r_{i}N)-r_{i}N]\\
        &=t(-1+\Delta)-t\Delta+0*(n-t-1)\\
        &=-t
        \end{split}
        $$

      - So, $\{x|x\in[-n+1,0],x\in \mathbb{Z}\}\subseteq R(f,n)$,

      Therefore, $\{x|x \in (-n,0],x\in \mathbb{Z}\}\subseteq R(f,n)$.

    So, `3` is proofed.

4.  Combine `2` and `3`:
    $\forall n \in \mathbb{Z}^+, R(f,n)=\{f(r,n,N)|(r,N)\in F_{r,N}\}=\{x|x\in (-n,0],x\in \mathbb{Z}\}$.

## A.8

The proof procedure of solution 2 that based on `floor()` function. For
better readability, we divide the proof process into several parts. The
first one is a pre-explanation, followed by assumptions and
extrapolations step by step, until the conclusion is reached.

1.  Preliminary illustrations:

    $$
    \begin{split}
     &\text{Basing on \eqref{NIP_problem_floor} and \eqref{solution_floor}, try to proof the correctness of \eqref{solution_floor}}.\\
     &\text{Known conditions:}\\
     &~~~~n,N \in \mathbb{Z}^+, n \le N\\
     &~~~~p\in \mathbb{R},~p\ge 1\\
     &~~~~r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\\
     &~~~~m=N-\sum_{i=1}^n floor(r_iN)\\
     &~~~~m \in \mathbb{Z},\text{and }0\le m<n (\text{according to \eqref{floor_range}})\\
     &\text{Define }x=[x_1,x_2,\ldots,x_n], \forall i \in \{1,2,\ldots,n\},x_i = floor(r_iN)-r_iN.\\
     &\text{also from \eqref{floor_range}, there is }-n< floor(r_iN)-r_iN \le 0.\\
     &\text{Without loss of generality, let }-n< x_1\le x_2\le \ldots \le x_n \le 0.\\
     &\text{Define }B_f=\{b|b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m,[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n\}.\\
     &\text{Define }B^{'}_f=\{b|b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m\}.\\
     &\text{Define solutions set }B^{*}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B_f}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}.\\
     &\text{Define solutions set }B^{*'}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B^{'}_f}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}.\\
     &\text{If }m\ge 0, \text{then }\exists b=[m,0,\ldots,0]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m,\\
     &~~~~\text{and make }[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n,\\
     &\text{therefore } \exists b\in B_f,\\
     &\text{i.e., }\empty \ne B_f,\\
     &\text{therefore, there are }B_f\subseteq B^{'}_f, \empty \ne B^{*}_f\subseteq B_f,~\empty\ne B^{*'}_f \subseteq B^{'}_f.\\
     \end{split}
    $$

2.  Assumption 1

    $$
    \begin{split}
     &\text{Assume that,}\exists b=[b_1,b_2,\ldots,b_n]\in B^{*'}_f \subseteq B^{'}_f,\\
     &~~~~\text{and simultaneously } b\in B_1= \{b|b=[b_1,b_2,\ldots,b_n] \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m, \exists s,t, b_s\ge 1,b_t\le -1\}\subseteq B^{'}_f.\\
     &\text{Without loss of generality, let }s<t.\\
     &\text{So, there is } b=[\ldots,b_s,\ldots,b_t,\ldots] \in B^{*'}_f \cap B_1.\\
     &\text{Define }b^{'}=[\ldots,b^{'}_s,\ldots,b^{'}_t,\ldots]=[\ldots,b_s-1,\ldots,b_t+1,\ldots]\in B^{'}_f,\text{i.e.},~b^{'}_s=b_s-1,b^{'}_t=b_t+1,\\
     &\text{therefore }\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|floor(r_sN)+b^{'}_s-r_{s}N |^{p}+|floor(r_tN)+b^{'}_t-r_{t}N |^{p}-|floor(r_sN)+b_s-r_{s}N |^{p}-|floor(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|floor(r_sN)+b_s-1-r_{s}N |^{p}+|floor(r_tN)+b_t+1-r_{t}N |^{p}-|floor(r_sN)+b_s-r_{s}N |^{p}-|floor(r_tN)+b_t-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(b_s,floor(r_sN)-r_{s}N)-I(b_t,floor(r_tN)-r_{t}N)\\
     &\le -I(0,floor(r_sN)-r_{s}N)-I(0,floor(r_tN)-r_{t}N)\\
     &=0+0=0,\\
     &\text{therefore }\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}\le \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{i.e. }(\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\le (\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{so, }b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in B_1~\text{or }b^{'}\in\complement_{B^{'}_{f}}{B_1}.\text{If }b^{'}\in B_1,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure, and then get $b^{''}$.}\\
     &~~~~~~~~~~~\text{Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_{f}}{B_1},\text{i.e.},~\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty.\\
     &\text{Then, according to lemma $1$ \eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_f}B_1 \cap B^{*'}_f \ne \empty.\\
     \end{split}
    $$

3.  Assumption 2

    $$
    \begin{split}
     &\text{Assume that:}\exists b=[b_1,b_2,\ldots,b_n]\in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \subseteq B^{'}_f,\\
     &~~~~\text{and simultaneously } b\in B_2= \{b|b=[b_1,b_2,\ldots,b_n],~ b_i \in \mathbb{Z},~\sum_{i=1}^n b_i = m, \exists s,~b_s\ge 2\}\subseteq B^{'}_f.\\
     &\text{Since }b \in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2,\\
     &\text{so }\exists~s,b_s\ge 2,\\
     &\text{therefore, for all }i \in \{1,2,\ldots,n\},\text{there is }b_{i}\ge 0,\\
     &\text{and according to \eqref{floor_range}, there is }0\le \sum_{i=1}^n b_i <n,\\
     &\text{therefore }\exists t\ne s,\text{that }b_t=0.\\
     &\text{Without loss of generality, let }s<t.\\
     &\text{So, there is } b=[\ldots,b_s,\ldots,b_t,\ldots] \in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2.\\
     &\text{Define }b^{'}=[\ldots,b^{'}_s,\ldots,b^{'}_t,\ldots]=[\ldots,b_s-1,\ldots,b_t+1,\ldots]\in \complement_{B^{'}_f}B_1,\text{i.e., }b^{'}_s=b_s-1,b^{'}_t=b_t+1=1,\\
     &\text{so, } \sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|floor(r_sN)+b^{'}_s-r_{s}N |^{p}+|floor(r_tN)+b^{'}_t-r_{t}N |^{p}-|floor(r_sN)+b_s-r_{s}N |^{p}-|floor(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|floor(r_sN)+b_s-1-r_{s}N |^{p}+|floor(r_tN)+1-r_{t}N |^{p}-|floor(r_sN)+b_s-r_{s}N |^{p}-|floor(r_tN)-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(b_s,floor(r_sN)-r_{s}N)+I(1,floor(r_tN)-r_{t}N)\\
     &=-[I(b_s,floor(r_sN)-r_{s}N)-I(1,floor(r_tN)-r_{t}N)]\\
     &\le0,\\
     &\text{therefore, there is } \sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}\le \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{i.e., }(\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\le (\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{so, } b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in \complement_{B^{'}_f}B_1\cap B_2~\text{or }b^{'}\in\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}. \text{If }b^{'}\in \complement_{B^{'}_f}B_1\cap B_2,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure}\\
     &~~~~~~~~~~~\text{and then get $b^{''}$.Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2},\text{i.e.},~\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \ne \empty.\\
     &\text{Then, according to lemma $1$ \eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \ne \empty.\\
     \end{split}
    $$

4.  Assumption 3

    $$
    \begin{split}
     &\text{Assume that:}\exists b=[b_1,b_2,\ldots,b_n]\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f\subseteq B^{'}_{f},~\text{and simultaneously}\\
     &~~~~b\in B_3= \{b|b=[b_1,b_2,\ldots,b_n],~ b_i \in \mathbb{Z},~\sum_{i=1}^n b_i = m, \exists s,t,~0\le b_s<b_t,x_s<x_t\}\subseteq B^{'}_{f}.\\
     &\text{Because }-0.5\le x_1\le x_2\le \ldots \le x_n \le 0.5,\\
     &\text{therefore, there must be }s<t.\\
     &\text{Since }b \in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_3,\\
     &\text{so }\exists~0\le b_s<b_t,x_s<x_t,\\
     &\text{therefore, for all }i \in \{1,2,\ldots,n\},\text{there is }b_{i}\in \{0,1\},\\
     &\text{hence, }b_s=0, b_t = 1.\\
     &\text{So,there is }b=[\ldots,b_s,\ldots,b_t,\ldots] \in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_3.\\
     &\text{Define }b^{'}=[\ldots,b^{'}_s,\ldots,b^{'}_t,\ldots]=[\ldots,b_s+1,\ldots,b_t-1,\ldots]\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1,\text{i.e.},~b^{'}_s=b_s+1=1,b^{'}_t=b_t-1=0,\\
     &\text{therefore }\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|floor(r_sN)+b^{'}_s-r_{s}N |^{p}+|floor(r_tN)+b^{'}_t-r_{t}N |^{p}-|floor(r_sN)+b_s-r_{s}N |^{p}-|floor(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|floor(r_sN)+1-r_{s}N |^{p}+|floor(r_tN)-r_{t}N |^{p}-|floor(r_sN)-r_{s}N |^{p}-|floor(r_tN)+1-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &=I(1,floor(r_sN)-r_{s}N)-I(1,floor(r_tN)-r_{t}N)\\
     &=I(1,x_s)-I(1,x_t)\\
     &\le 0, \text{since }x_s<x_t,\\
     &\text{therefore, there is }\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}\le \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{i.e., }(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\le (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{so, } b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap B_3~\text{or }b^{'}\in\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3}.\\
     &~~~~~~~~~~~\text{If }b^{'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap B_3,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure}\\
     &~~~~~~~~~~~\text{and then get $b^{''}$. Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3},\text{i.e.},~\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3}\cap B^{*'}_f \ne \empty.\\
     &\text{Then, according to lemma $1$ \eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_f}B_2\cap\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty.\\
     \end{split}
    $$

5.  Consider a special $b$

    $$
    \begin{split}
     &\text{Define: }B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1.\\
     &\text{Konwn: }x = [x_1,x_2,\ldots,x_n], x_i = floor(r_iN)-r_iN,-1< x_1\le x_2\le \ldots \le x_n \le 0.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n floor(r_iN), \text{and from conclusion \eqref{floor_range}, there are }m \in \mathbb{Z},\text{and }0\le m<n.\\ 
     &~~~~(1)~\text{If }m>0, \text{then let }b=[b_1,b_2,\ldots,b_n]=[1,1,\ldots,1,0,0,\ldots,0],\\
     &~~~~~~~~\text{whose the first $|m|$ elements are $1$, the rest are }0.\\
     &~~~~(2)~\text{If }m=0, \text{then let }b=[b_1,b_2,\ldots,b_n]=[0,0,\ldots,0].\\
     &\text{Obviously},~b\in B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1.\\
     \end{split}
    $$

6.  Assumption 4 that proof the above $b\in B^{*'}_{f}$:

    $$
    \begin{split}
     &\text{Assume that:}\exists b^{'}=[b^{'}_1,b^{'}_2,\ldots,b^{'}_n]\in B_t=\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1, b^{'}\ne b,\\
     &\text{that make} (\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}<(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}.\\
     &\text{Define }f:\{\mathbb{Z}^+,\mathbb{Z}^-\cup\mathbb{Z}^+\}\rightarrow \mathbb{Z}^n\\
     &~~~~\forall i,v~~i\in\mathbb{Z}^+,i\le n, v\in \mathbb{Z}^-\cup\mathbb{Z}^+,\\
     &~~~~f(i,v)=[0,0,\ldots,0,v,0,\ldots,0]\in \mathbb{N},\\
     &~~~~\text{represents a vector whose the i-th element is $v$ and other elements are all }0.\\
     \text{So, if }&m>0:\\
     &\text{because }p\ge 1,p\in \mathbb{R},\\
     &\text{therefore }(\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p})<(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}),\\
     &\text{and because }m>0,\\
     &\text{hence }b = [1,1,\ldots,1,0,0,\ldots,0],\\
     &~~~~\text{whose the first $|m|$ elements are $1$, the rest are }0.\\
     &\text{Without loss of generality, let}\\
     &~~~~b^{'} = b+f(s_1,-1)+f(s_2,-1)+\ldots+f(s_k,-1)+f(t_1,1)+f(t_2,1)+\ldots+f(t_k,1),\\
     &~~~~\text{where }k \in \mathbb{Z}^+~1\le s_1<s_2<\ldots<s_k\le m<t_1<t_2<\ldots<t_k\le n,\\
     &~~~~\text{and }\forall i\in \{1,2,\ldots,k\}~s_i,t_i \in \mathbb{Z},\\
     &\text{therefore for all }i\in \{1,2,\ldots,k\},\text{there are }b_{s_i}=1,b_{t_i}=0,b^{'}_{s_i}=b_{s_i}-1=0,b^{'}_{t_i}=b_{t_i}+1=1,\\
     &\text{so }(\sum_{i=1}^k |floor(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|floor(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p})\\
     &~~~~<(\sum_{i=1}^k |floor(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|floor(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p}),\\
     (I)\rightarrow &\text{ therefore }(\sum_{i=1}^k |floor(r_{s_i}N)-r_{s_i}N |^{p}+|floor(r_{t_i}N)+1-r_{t_i}N |^{p})\\
     &~~~~<(\sum_{i=1}^k |floor(r_{s_i}N)+1-r_{s_i}N |^{p}+|floor(r_{t_i}N)-r_{t_i}N |^{p}),\\
     &\text{and  because for all }i\in \{1,2,\ldots,k\},\text{ there is}\\
     & |floor(r_{s_i}N)-r_{s_i}N |^{p}+|floor(r_{t_i}N)+1-r_{t_i}N |^{p}-|floor(r_{s_i}N)+1-r_{s_i}N |^{p}-|floor(r_{t_i}N)-r_{t_i}N |^{p}\\
     &=-I(1,floor(r_{s_i}N)-r_{s_i}N)+I(1,floor(r_{t_i}N)-r_{t_i}N)\\
     &=-I(1,x_{s_i})+I(1,x_{t_i})\\
     &\ge 0,since~b\in \complement_{B^{'}_{f}}{B_3},b_{s_i}>b_{t_i}, x_{s_i}\le x_{t_i},\\
     &\text{therefore, }(\sum_{i=1}^k |floor(r_{s_i}N)-r_{s_i}N |^{p}+|floor(r_{t_i}N)+1-r_{t_i}N |^{p})\\
     &~~~~\ge (\sum_{i=1}^k |floor(r_{s_i}N)+1-r_{s_i}N |^{p}+|floor(r_{t_i}N)-r_{t_i}N |^{p}),\\
     &\text{which is contradictory to (I), so the above assumption is not valid.}\\
     \text{If }&m=0:\\
     &\text{Obviously}, B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1~\text{is a single-element set, there is }\nexists b^{'}\ne b,\text{that }b^{'}\in B_t,\\
     &\text{so the above assumption is not valid.}\\
     \text{So},&~\text{regardless of the value of $m$, the above assumption is always not valid, i.e.,}\\
     &\text{there must be}\\
     &b\in \{b|b=\mathop{\arg\min}\limits_{b\in B_t}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\},\\
     &\text{and, because }B_t \cap B^{*'}_f \ne \empty, \text{and }B_t \subseteq B^{'}_f,\\
     &\text{and according to \eqref{lemma_2}, there must be}\\
     &\empty \ne \{b|b=\mathop{\arg\min}\limits_{b\in B_t}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\} \subseteq B^{*'}_f,\\
     &\text{therefore }b\in B^{*'}_f.\\
     \end{split}
    $$

7.  Consider if the specific $b$ satisfies that
    $b\in B_f \subseteq B^{'}_f$:

    $$
    \begin{split}
     &\text{Konwn: }x = [x_1,x_2,\ldots,x_n], x_i = floor(r_iN)-r_iN,-1< x_1\le x_2\le \ldots \le x_n \le 0.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n floor(r_iN), \text{and from }\eqref{floor_range}, \text{there are }m \in \mathbb{Z},\text{and }0\le m<0.\\ 
     &\text{Try to proof the above $b$ satisfies that $b\in B_f \subseteq B^{'}_f$, i.e.,}\\
     &~~~~\text{try to proof the above $b$ satisfies }[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n.\\
     &(1)\text{If }m>0, \text{then }b=[b_1,b_2,\ldots,b_n]=[1,1,\ldots,1,0,0,\ldots,0],\\
     &~~~~\text{whose the first $|m|$ elements are $1$ and the rest are }0,\\
     &~~~~\text{then the constraint }[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n \text{is valid.}\\
     &(2)\text{If }m=0, \text{then }b=[b_1,b_2,\ldots,b_n]=[0,0,\ldots,0],\\
     &~~~~\text{then the constraint }[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n \text{is still valid.}\\
     \text{So},&~\text{regardless of the value of }m,\\
     &\text{the above $b$ always satisfies }[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n,~\text{i.e.},\\
     &\text{the above $b$ satisfies that }b\in B_f \subseteq B^{'}_f.\\
     \end{split}
    $$

8.  Finally

    $$
    \begin{split}
     &\text{Konwn: }x = [x_1,x_2,\ldots,x_n], x_i = floor(r_iN)-r_iN,-1< x_1\le x_2\le \ldots \le x_n \le 0.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n floor(r_iN), \text{and from }\eqref{floor_range}, \text{there are }m \in \mathbb{Z},\text{and }0\le m<0.\\ 
     &\text{Since the above vector $b$, i.e.,}\\
     &~~~~(1)~\text{if }m>0, \text{then }b=[b_1,b_2,\ldots,b_n]=[1,1,\ldots,1,0,0,\ldots,0],\\
     &~~~~~~~~\text{whose the first $|m|$ elements are $1$, the rest are }0,\\
     &~~~~(2)~\text{if }m=0, \text{then }b=[b_1,b_2,\ldots,b_n]=[0,0,\ldots,0],\\
     &~~~~\text{that satisfies }b\in B^{*'}_f~\text{and }b\in B_f \subseteq B^{'}_f.\\
     &\text{Then, according to \ref{lemma_3}, the final conclusion can be drawn as}\\
     &~~~~b\in B^{*}_f \subseteq B^{*'}_f.\\
     \end{split}
    $$

Along the above 8 points, the
[Solution-2](#Solution 2, based on floor() function) is proofed totally.

## A.9

Here are some standards or explanations of a stable sorting algorithm:

- A sort is stable if it guarantees not to change the relative order of
  elements that compare equal — this is helpful for sorting in multiple
  passes (for example, sort by department, then by salary grade).[^6]
- [Stable sorting
  algorithms](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability)
  maintain the relative order of records with equal keys (i.e.,
  values).[^7]See
  [here](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability) for
  more information.

## A.10

- Try to compare the results of solution 1 and solution 2. The basic
  conditions are as follows:

  $$
  \begin{split}
    \text{Known:}~~~~&n,N \in \mathbb{Z}^+, n \le N,\\
    &p\in \mathbb{R},~p\ge 1,\\
    &r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1.\\
    \text{Define:}&~I_s =\{1,2,\ldots,s\},\\
    &I_{st}=\{s+1,s+2,\ldots,t-2,t-1\},\\
    &I_{tn} =\{t,t+1,\ldots,n-1,n\},\\
    &~~~~\text{where }s,t\in \mathbb{Z}^+,1\le s\le t\le n.\\
    &m^{'}=N-\sum_{i=1}^n floor(r_iN),\text{and from conclusion \eqref{floor_range}, there are }m^{'} \in \mathbb{Z},\text{and }0\le m^{'}<n.\\
    &y^{'} \text{is the result $y$ from solution $1$.}\\
    &m^{''}=N-\sum_{i=1}^n round(r_iN),\text{and from conclusion \eqref{round_conclusion}, there are }m^{''} \in \mathbb{Z},\text{and }-\frac{n}{2}\le m^{''}\le \frac{n}{2}.\\
    &y^{''} \text{is the result $y$ from solution $2$.}\\
    \text{Try to analyze:}&~\text{If $y^{'}$ is the same to $y^{''}$?}
    \end{split}
  $$

- Analyze the result of solution 2 first:

  $$
  \begin{split}
    &\text{From solution 2}:\\
    &~~~~\text{There is }x^{'}=[x^{'}_1,x^{'}_2,\ldots,x^{'}_n],\forall i \in \{1,2,\ldots,n\},x^{'}_i = floor(r_iN)-r_iN.\\
    &\text{Without loss of generality, let }\\
    &~~~~-1<x^{'}_1\le x^{'}_2\le \ldots \le x^{'}_s< -0.5,\\
    &~~~~\forall i \in I_{st }x^{'}_i = -0.5,\\
    &~~~~-0.5<x^{'}_t\le x^{'}_{t+1}\ldots \le x^{'}_n \le 0.\\
    &\text{so }-1<x^{'}_1\le x^{'}_2\le \ldots \le x^{'}_s< -0.5=x^{'}_{s+1}=x^{'}_{s+2}=\ldots=x^{'}_{t-2}=x^{'}_{t-1}=-0.5<x^{'}_t\le x^{'}_{t+1}\ldots \le x^{'}_n \le 0.\\
    &\text{therefore }y^{'}=[floor(r_1N)+b^{'}_1,floor(r_2N)+b^{'}_2,\ldots,floor(r_nN)+b^{'}_n],\\
    &~~~~\text{where}\\ 
    &~~~~~~~~(1)~\text{If }m^{'}>0, \text{then set }b^{'}=[b^{'}_1,b^{'}_2,\ldots,b^{'}_n]=[1,1,\ldots,1,0,0,\ldots,0],\\
    &~~~~~~~~~~~~\text{whose the first $|m^{'}|$ elements are $ 1$ and the rest are $0$},\\
    &~~~~~~~~(2)~\text{If }m^{'}=0, \text{then set }b^{'}=[b^{'}_1,b^{'}_2,\ldots,b^{'}_n]=[0,0,\ldots,0].\\
    &\text{From solution 1}:\\
    &~~~~\text{There is }x^{''}=[x^{''}_1,x^{''}_2,\ldots,x^{''}_n],\forall i \in \{1,2,\ldots,n\},~x^{''}_i = round(r_iN)-r_iN.\\
    &\text{therefore }y^{''}=[round(r_1N)+b^{''}_1,round(r_2N)+b^{''}_2,\ldots,round(r_nN)+b^{''}_n],\\
    &~~~~\text{where},\\ 
    &~~~~~~~~(1)~\text{If }m^{''}>0, \text{then set }b^{''}=[b^{''}_1,b^{''}_2,\ldots,b^{''}_n]=[1,1,\ldots,1,0,0,\ldots,0],\\
    &~~~~~~~~~~~~\text{whose the first $|m^{''}|$ elements are $ 1$ and the rest are $0$},\\
    &~~~~~~~~(2)~\text{If }m^{''}=0, \text{then set }b^{''}=[b^{''}_1,b^{''}_2,\ldots,b^{''}_n]=[0,0,\ldots,0],\\
    &~~~~~~~~(3)~\text{If }m^{''}<0, \text{then set }b^{''}=[b^{''}_1,b^{''}_2,\ldots,b^{''}_n]=[0,0,\ldots,-1,-1,\ldots,-1],\\
    &~~~~~~~~~~~~\text{whose the first $|m^{''}|$ elements are $-1$ and the rest are $0$}.
    \end{split}
  $$

- Then, analyze the result of solution 1 when $round(\cdot)$ is as
  $\eqref{round_1}$

  $$
  \begin{split}
    \text{(I)If}&~round(\cdot)~\text{is }\forall x \in \mathbb{R}^+\cup\{0\} round_1(x)=\begin{cases}
    \lfloor x\rfloor, \text{if }x-\lfloor x\rfloor<0.5 \\
    \lceil x\rceil, \text{if }x-\lfloor x\rfloor \ge 0.5
    \end{cases},\text{ as \eqref{round_1}},\\
    &\text{then }\forall i \in \{1,2,\ldots,n\} x^{''}_i=round(r_iN)-r_iN =\begin{cases}
    floor(r_iN)-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor<0.5 \\
    floor(r_iN)+1-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor \ge 0.5
    \end{cases}\\
    &=\begin{cases}
            x^{'}_i, \text{if }x^{'}_i>-0.5 \\
            x^{'}_i+1, \text{if }x^{'}_i \le -0.5
            \end{cases}.\\             
    &\text{So, according to $x^{'}$, there is}\\
    &\forall i \in I_s,-1<x^{'}_i<-0.5,x^{''}_i=x^{'}_i+1,\\
    &~~~~0<x^{''}_1=x^{'}_1+1\le x^{''}_2=x^{'}_2+1\le \ldots \le x^{''}_s=x^{'}_s+1<0.5,\\
    &\forall i \in I_{tn},-0.5<x^{'}_i\le 0,x^{''}_i=x^{'}_i,\\
    &~~~~-0.5< x^{''}_t=x^{'}_t\le x^{''}_{t+1}=x^{'}_{t+1}\ldots \le x^{''}_n=x_n\le 0,\\
    &\forall i \in I_{st},x^{'}_i=-0.5,x^{''}_i=x^{'}_i+1,\\
    &~~~~0.5=x^{''}_{s+1}=x^{'}_{s+1}+1=x^{''}_{s+2}=x^{'}_{s+2}+1=..=x^{''}_{t-2}=x^{'}_{t-2}+1=x^{''}_{t-1}=x^{'}_{t-1}+1.\\
    &\text{And, if a stable sorting algorithm (see appendix A.9) is applied, we can get}\\
    &~~~~-0.5< x^{''}_t\le x^{''}_{t+1}\ldots \le x^{''}_n\le 0<x^{''}_1\le x^{''}_2\le \ldots \le x^{''}_s<x^{''}_{s+1}=x^{''}_{s+2}=\ldots=x^{''}_{t-2}=x^{''}_{t-1}=0.5,\\
    &\text{therefore }m^{''}=N-\sum_{i=1}^n round(r_iN)=\sum_{i=1}^n[r_iN-round(r_iN)]=-\sum_{i=1}^n[x^{''}]=-[\sum_{i=1}^nx^{'}]-(t-1)=m^{'}-(t-1).\\
    &\text{If }m^{''}=m^{'}-(t-1)= 0,\\
    &\text{then }m^{'}= (t-1),\\
    &\text{so, } \forall i \in \{1,2,\ldots,t-1\},b^{'}_i=1,\forall i \in \{t,t+1,\ldots,n\},b^{'}_i=0,\\
    &\text{hence, }\forall i \in \{1,2,\ldots,t-1\},y^{'}_i=floor(r_iN)+1,\forall i \in \{t,t+1,\ldots,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,\ldots,floor(r_{t-1}N)+1,floor(r_tN),floor(r_{t+1}N),\ldots,floor(r_{n}N)].\\
    &\text{Because }m^{''}= 0,\\
    &\text{so, }\forall i \in \{1,2,\ldots,n\},b^{''}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,\ldots,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),\ldots,round(r_nN)],\\
    &\text{hence, }\forall i \in I_s~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in I_{st }y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  I_{tn }y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0.\\
    &\text{If }m^{''}=m^{'}-(t-1)> 0,\\
    &\text{then }m^{'}> (t-1),\\
    &\text{so, }\forall i \in \{1,2,\ldots,t-1,t,t+1,\ldots,m^{'}\},b^{'}_i=1,\forall i \in \{m^{'}+1,m^{'}+2,\ldots,n\},b^{'}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,\ldots,t-1,t,t+1,\ldots,m^{'}\},y^{'}_i=floor(r_iN)+1,\forall i \in \{m^{'}+1,m^{'}+2,\ldots,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,\ldots,floor(r_{t-1}N)+1,\\
    &~~~~floor(r_{t}N)+1,floor(r_{t+1}N)+1,\ldots,floor(r_{m^{'}}N)+1,\\
    &~~~~floor(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),\ldots,floor(r_{n}N)].\\
    &\text{Because }m^{''}> 0,\\
    &\text{so }\forall i \in \{t,t+1,\ldots,t-1+m^{'}-(t-1)\},b^{''}_i=1,\forall i \in \{1,2,\ldots,t-1,m^{'}+1,m^{'}+2,\ldots,n\},b^{''}_i=0,\\
    &\text{therefore }\forall i \in \{t,t+1,\ldots,m^{'}\},y^{'}_i=round(r_iN)+1,\forall i \in \{1,2,\ldots,t-1,m^{'}+1,m^{'}+2,\ldots,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),\ldots,round(r_{t-1}N),\\
    &round(r_tN)+1,round(r_{t+1}N)+1,\ldots,round(r_{m'}N)+1,\\
    &round(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),\ldots,floor(r_{n}N)],\\
    &\text{hence }\forall i \in I_s~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in I_{st }y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{t,t+1,\ldots,m^{'}\}~y^{''}_i-y^{'}_i=round(r_iN)+1-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN+1-(floor(r_iN)-r_iN+1)=x^{''}_i+1-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{m^{'}+1,m^{'}+2,\ldots,n-1,n\}~y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0.\\
    &\text{If }m^{''}=m^{'}-(t-1)< 0,\\
    &\text{then }m^{'}< (t-1),\\
    &\text{so, }\forall i \in \{1,2,\ldots,m^{'}\},b^{'}_i=1,\forall i \in \{m^{'}+1,m^{'}+2,\ldots,t-1,t,\ldots,n-1,n\},b^{'}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,\ldots,m^{'}\},y^{'}_i=floor(r_iN)+1,\forall i \in \{m^{'}+1,m^{'}+2,\ldots,t-1,t,\ldots,n-1,n\},y^{'}_i=floor(r_iN)，\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,\ldots,floor(r_{m^{'}}N)+1,\\
    &floor(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),\ldots,floor(r_{t-1}N),floor(r_tN),\ldots,floor(r_{n-1}N),floor(r_{n}N)].\\
    &\text{Because }m^{''}< 0,\\
    &\text{so, }\forall i \in \{t-1-[(t-1)-m^{'}]+1,t-1-[(t-1)-m^{'}]+2,\ldots,t-1\},\\
    &~~~~b^{''}_i=-1,\forall i \in \{1,2,\ldots,t-1-[(t-1)-m^{'}],t,t+1,\ldots,n\},b^{''}_i=0,\\
    &\text{therefore, }\forall i \in \{m^{'}+1,m^{'}+2,\ldots,t-1\},y^{'}_i=round(r_iN)-1,\forall i \in \{1,2,\ldots,m^{'},t,t+1,\ldots,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),\ldots,round(r_{m^{'}}N),\\
    &~~~~round(r_{m^{'}+1}N)-1,round(r_{m^{'}+2}N)-1,\ldots,round(r_{t-1}N)-1,\\
    &~~~~round(r_{t}N),floor(r_{t+1}N),\ldots,round(r_nN)],\\
    &\text{hence, }\forall i \in I_s \cup \{s+1,s+2,\ldots,m^{'}\} ~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{m^{'}+1,m^{'}+2,\ldots,t-1\}~y^{''}_i-y^{'}_i=round(r_iN)-1-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{t,t+1,\ldots,n-1,n\}~y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0.\\
    &\text{So,regardless of any }m^{''}, \text{there always be }\forall i \in \{1,2,\ldots,n\}, y^{''}_i-y^{'}_i=0,\\
    &\text{i.e. }y^{''}=y^{'}.
    \end{split}
  $$

- Then, analyze the result of solution 1 when $round(\cdot)$ is as
  $\eqref{round_2}$

  $$
  \begin{split}
    \text{(II)If}&~round(\cdot)~\text{is }\forall x \in \mathbb{R}^+\cup\{0\},~round_2(x)=  \begin{cases}
        \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor \le 0.5 \\
        \lceil x\rceil,\text{if }x-\lfloor x\rfloor > 0.5
        \end{cases},\text{ as \eqref{round_2}},\\
    &\text{then }\forall i \in \{1,2,\ldots,n\} x^{''}_i=round(r_iN)-r_iN =\begin{cases}
        floor(r_iN)-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor \le 0.5 \\
        floor(r_iN)+1-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor > 0.5
        \end{cases}\\
    &=\begin{cases}
            x^{'}_i, \text{if }x^{'}_i \ge -0.5 \\
            x^{'}_i+1, \text{if }x^{'}_i < -0.5
            \end{cases}.\\
    &\text{So, according to $x^{'}$, there is}\\
    &\forall i \in I_s,-1<x^{'}_i<-0.5,x^{''}_i=x^{'}_i+1,\\
    &~~~~0<x^{''}_1=x^{'}_1+1\le x^{''}_2=x^{'}_2+1\le \ldots \le x^{''}_s=x^{'}_s+1<0.5,\\
    &\forall i \in I_{tn},-0.5<x^{'}_i\le 0,x^{''}_i=x^{'}_i,\\
    &~~~~-0.5< x^{''}_t=x^{'}_t\le x^{''}_{t+1}=x^{'}_{t+1}\ldots \le x^{''}_n=x_n\le 0,\\
    &\forall i \in I_{st},x^{'}_i=-0.5,x^{''}_i=x^{'}_i,\\
    &~~~~-0.5=x^{''}_{s+1}=x^{'}_{s+1}=x^{''}_{s+2}=x^{'}_{s+2}=..=x^{''}_{t-2}=x^{'}_{t-2}=x^{''}_{t-1}=x^{'}_{t-1}.\\
    &\text{And,if a stable sorting algorithm (see appendix A.9) is applied, we can get}\\
    &-0.5=x^{''}_{s+1}=x^{''}_{s+2}=\ldots=x^{''}_{t-2}=x^{''}_{t-1}< x^{''}_t\le x^{''}_{t+1}\ldots \le x^{''}_n\le 0<x^{''}_1\le x^{''}_2\le \ldots \le x^{''}_s<0.5,\\
    &\text{therefore }m^{''}=N-\sum_{i=1}^n round(r_iN)=\sum_{i=1}^n[r_iN-round(r_iN)]=-\sum_{i=1}^n[x^{''}]=-[\sum_{i=1}^nx^{'}]-s=m^{'}-s.\\
    &\text{If }m^{''}=m^{'}-s= 0,\\
    &\text{then }m^{'}= s,\\
    &\text{so, }\forall i \in \{1,2,\ldots,s\},b^{'}_i=1,\forall i \in \{s+1,s+2,\ldots,n\},b^{'}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,\ldots,s\},y^{'}_i=floor(r_iN)+1,\forall i \in \{s+1,s+2,\ldots,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,\ldots,floor(r_{s}N)+1,floor(r_{s+1}N),floor(r_{s+2}N),\ldots,floor(r_{n}N)].\\
    &\text{Because }m^{''}= 0,\\
    &\text{so, }\forall i \in \{1,2,\ldots,n\},b^{''}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,\ldots,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),\ldots,round(r_nN)],\\
    &\text{hence, }\forall i \in I_s~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in I_{st }y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0,\\
    &~~~~~~\forall i \in  I_{tn }y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0.\\
    &\text{If }m^{''}=m^{'}-s> 0,\\
    &\text{then }m^{'}> s,\\
    &\text{so, }\forall i \in \{1,2,\ldots,s-1,s,s+1,\ldots,m^{'}\},b^{'}_i=1,\forall i \in \{m^{'}+1,m^{'}+2,\ldots,n\},b^{'}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,\ldots,s-1,s,s+1,\ldots,m^{'}\},y^{'}_i=floor(r_iN)+1,\forall i \in \{m^{'}+1,m^{'}+2,\ldots,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,\ldots,floor(r_{s-1}N)+1,\\
    &~~~~floor(r_{s}N)+1,floor(r_{s+1}N)+1,\ldots,floor(r_{m^{'}}N)+1,\\
    &~~~~floor(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),\ldots,floor(r_{n}N)].\\
    &\text{Because }m^{''}> 0,\\
    &\text{so, }\forall i \in \{s+1,s+2,\ldots,s+m^{'}-s\},b^{''}_i=1,\forall i \in \{1,2,\ldots,s,m^{'}+1,m^{'}+2,\ldots,n\},b^{''}_i=0,\\
    &\text{therefore, }forall i \in \{s+1,s+2,\ldots,m^{'}\},y^{'}_i=round(r_iN)+1,\forall i \in \{1,2,\ldots,s,m^{'}+1,m^{'}+2,\ldots,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),\ldots,round(r_{s}N),\\
    &~~~~round(r_{s+1}N)+1,round(r_{s+2}N)+1,\ldots,round(r_{m'}N)+1,\\
    &~~~~round(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),\ldots,floor(r_{n}N)].\\
    &\text{hence, }\forall i \in I_s~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{s+1,s+2,\ldots,m^{'}\}~y^{''}_i-y^{'}_i=round(r_iN)+1-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN+1-(floor(r_iN)-r_iN+1)=x^{''}_i+1-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{m^{'}+1,m^{'}+2,\ldots,n-1,n\}~y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0.\\
    &\text{If }m^{''}=m^{'}-s< 0,\\
    &\text{then }Wm^{'}< s,\\
    &\text{so, }\forall i \in \{1,2,\ldots,m^{'}\},b^{'}_i=1,\forall i \in \{m^{'}+1,m^{'}+2,\ldots,s,s+1,\ldots,n-1,n\},b^{'}_i=0,\\
    &\text{therefore }\forall i \in \{1,2,\ldots,m^{'}\},y^{'}_i=floor(r_iN)+1,\forall i \in \{m^{'}+1,m^{'}+2,\ldots,s,s+1,\ldots,n-1,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,\ldots,floor(r_{m^{'}}N)+1,\\
    &~~~~floor(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),\ldots,floor(r_sN),\\
    &~~~~floor(r_{s+1}N),\ldots,floor(r_{n-1}N),floor(r_{n}N)].\\
    &\text{Because }m^{''}< 0,\\
    &\text{so, }\forall i \in \{s-[s-m^{'}]+1,s-[s-m^{'}]+2,\ldots,s\},b^{''}_i=-1,\forall i \in \{1,2,\ldots,s-[s-m^{'}],s+1,s+2,\ldots,n\},b^{''}_i=0,\\
    &\text{therefore }\forall i \in \{m^{'}+1,m^{'}+2,\ldots,s\},y^{'}_i=round(r_iN)-1,\forall i \in \{1,2,\ldots,m^{'},s+1,s+2,\ldots,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),\ldots,round(r_{m^{'}}N),\\
    &~~~~round(r_{m^{'}+1}N)-1,round(r_{m^{'}+2}N)-1,\ldots,round(r_{s}N)-1,\\
    &~~~~round(r_{s+1}N),floor(r_{s+2}N),\ldots,round(r_nN)],\\
    &\text{hence }\forall i \in  \{1,2,\ldots,m^{'}\}~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{m^{'}+1,m^{'}+2,\ldots,s\}~y^{''}_i-y^{'}_i=round(r_iN)-1-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{s+1,s+2,\ldots,n-1,n\}~y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-x^{'}_i=0.\\
    &\text{So,regardless of any }m^{''}, \text{there always be }\forall i \in \{1,2,\ldots,n\}, y^{''}_i-y^{'}_i=0,\\
    &\text{i.e., }y^{''}=y^{'}.
    \end{split}
  $$

- Then, analyze the result of solution 1 when $round(\cdot)$ is as
  $\eqref{round_3}$

  $$
  \begin{split}
    \text{(III)If}&~round(\cdot)~\text{is }\forall x \in \mathbb{R}^+\cup\{0\},~round_3(x)=\begin{cases}
        \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor<0.5 \\
        \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor=0.5,\lfloor x\rfloor \mod 2=0\\
        \lceil x\rceil,\text{if }x-\lfloor x\rfloor=0.5,\lceil x\rceil\mod 2= 0\\
        \lceil x\rceil,\text{if }x-\lfloor x\rfloor>0.5
        \end{cases},\text{ as \eqref{round_3}},\\
    &\text{then }\forall i \in \{1,2,\ldots,n\}~x^{''}_i\\
    &=round(r_iN)-r_iN =\begin{cases}
        floor(r_iN)-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor < 0.5 \\
        floor(r_iN)-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor=0.5,\lfloor r_iN\rfloor \mod 2=0\\
        floor(r_iN)+1-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor=0.5,\lceil r_iN\rceil\mod 2= 0\\
        floor(r_iN)+1-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor > 0.5
        \end{cases}\\
    &~~~~=\begin{cases}
            x^{'}_i, \text{if }x^{'}_i > -0.5 \\
            x^{'}_i, \text{if }x^{'}_i = -0.5,\lfloor r_iN\rfloor~\mod 2=0 \\
            x^{'}_i+1, \text{if }x^{'}_i = -0.5,\lceil r_iN\rceil~\mod 2= 0\\
            x^{'}_i+1, \text{if }x^{'}_i < -0.5
            \end{cases}.\\
    &\text{So, according to $x^{'}$, there is}\\
    &\forall i \in I_s,-1<x^{'}_i<-0.5,x^{''}_i=x^{'}_i+1,\\
    &~~~~0<x^{''}_1=x^{'}_1+1\le x^{''}_2=x^{'}_2+1\le \ldots \le x^{''}_s=x^{'}_s+1<0.5,\\
    &\forall i \in I_{tn},-0.5<x^{'}_i\le 0,x^{''}_i=x^{'}_i,\\
    &~~~~-0.5< x^{''}_t=x^{'}_t\le x^{''}_{t+1}=x^{'}_{t+1}\ldots \le x^{''}_n=x_n\le 0,\\
    &\text{assume that the element numbers of $I_{st}$ is }W \in \mathbb{N},\\
    &\text{define }I_{u}=\{u_1,u_2,\ldots,u_k\} \subseteq I_{st}, \forall i \in I_{st},x^{'}_i=-0.5,\lfloor r_iN\rfloor~\mod 2=0,\\
    &\text{and define }I_{v}=\complement_{I_{st}}I_{u_1}=\{v_1,v_2,\ldots,v_l\} \subseteq I_{st}, \forall i \in I_{st},x^{'}_i=-0.5,\lceil r_iN\rceil \mod 2=0,\\
    &~~~~\text{where }k,l\in \mathbb{N},\text{and}, \\
    &~~~~~~~~k+l=W,s<u_1<u_2<\ldots<u_k<t,s<v_1<v_2<\ldots<v_l<t,\\
    &\forall i \in I_{u},x^{'}_i=-0.5,x^{''}_i=x^{'}_i,\\
    &~~~~-0.5=x^{''}_{u_1}=x^{'}_{u_2}=\ldots=x^{'}_{u_k},\\
    &\forall i \in I_{v},x^{'}_i=-0.5,x^{''}_i=x^{'}_i+1,\\
    &~~~~-0.5+1=0.5=x^{''}_{v_1}=x^{'}_{v_2}=\ldots=x^{'}_{v_l}.\\
    &\text{And, if a stable sorting algorithm (see appendix A.9) is applied, we can get}\\
    &-0.5=x^{''}_{u_1}=x^{''}_{u_2}=\ldots=x^{''}_{u_k}< x^{''}_t\le x^{''}_{t+1}\ldots \le x^{''}_n\le 0<x^{''}_1\le x^{''}_2\le \ldots \le x^{''}_s<x^{''}_{v_1}=x^{'}_{v_2}=\ldots=x^{'}_{v_l}=0.5,\\
    &\text{therefore }m^{''}=N-\sum_{i=1}^n round(r_iN)=\sum_{i=1}^n[r_iN-round(r_iN)]=-\sum_{i=1}^n[x^{''}]=-[\sum_{i=1}^nx^{'}]-(s+l)=m^{'}-(s+l).\\
    &\text{If }m^{''}=m^{'}-(s+l)= 0,\\
    &\text{then }m^{'}= s+l,\\
    &\text{so, }\forall i \in \{1,2,\ldots,s,s+1,s+2,\ldots,s+l\},b^{'}_i=1,\forall i \in \{s+l+1,s+l+2,\ldots,n\},b^{'}_i=0,\\
    &\text{therefore }\forall i \in \{1,2,\ldots,s,s+1,s+2,\ldots,s+l\},y^{'}_i=floor(r_iN)+1,\forall i \in \{s+l+1,s+l+2,\ldots,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,\ldots,floor(r_{s}N)+1,\\
    &~~~~floor(r_{s+1}N)+1,floor(r_{s+2}N)+1,\ldots,floor(r_{s+l}N)+1,\\
    &~~~~floor(r_{s+l+1}N),floor(r_{s+l+2}N),\ldots,floor(r_{n}N)].\\
    &\text{Because }m^{''}= 0,\\
    &\text{so, }\forall i \in \{1,2,\ldots,n\},b^{''}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,\ldots,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),\ldots,round(r_nN)],\\
    &\text{hence }\forall i \in I_s~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in \{s+1,s+2,\ldots,s+l\}~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1),\\
    &~~~~~~~~\text{there is no guarantee that }x^{''}_i=(x^{'}_i+1),\\
    &~~~~~~\forall i \in \{s+l+1,s+l+2,\ldots,s+W\}~y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-x^{'}_i,\\
    &~~~~~~~~\text{there is no guarantee that }x^{''}_i=x^{'}_i,\\
    &~~~~~~\forall i \in  I_{tn}~y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-x^{'}_i=0.\\
    &\text{As the consequence, we cannot guarantee }y^{''}=y^{'},\\
    &\text{therefore, there is no need to discuss the conditions that } m^{''}=m^{'}-(s+l)> 0 \text{ and } m^{''}=m^{'}-(s+l)<0.\\
    &~~~~\text{A supporting example is as follows:}\\
    &~~~~~~~~x^{'}=[x^{'}_1,x^{'}_2,x^{'}_3,x^{'}_4,x^{'}_5,x^{'}_6,x^{'}_7,x^{'}_8,x^{'}_9,x^{'}_{10},x^{'}_{11},x^{'}_{12}]\\
    &~~~~~~~~~~~~=[-0.9,-0.8,-0.7,-0.6,-0.5,-0.5,-0.5,-0.5,-0.4,-0.3,-0.2,-0.1]\\
    &~~~~~~~~x^{''}=[x^{''}_1,x^{''}_2,x^{''}_3,x^{''}_4,x^{''}_5,x^{''}_6,x^{''}_7,x^{''}_8,x^{''}_9,x^{''}_{10},x^{''}_{11},x^{''}_{12}]\\
    &~~~~~~~~~~~~=[0.1,0.2,0.3,0.4,-0.5,0.5,-0.5,0.5,-0.4,-0.3,-0.2,-0.1]\\
    &~~~~~~~~m^{'}=-\sum_{i=1}^{12}x^{'}_i=6\\
    &~~~~~~~~m^{''}=-\sum_{i=1}^{12}x^{''}_i=0\\
    &~~~~~~~~[y^{''}_5-y^{'}_5,y^{''}_6-y^{'}_6,y^{''}_7-y^{'}_7,y^{''}_8-y^{'}_8]\\
    &~~~~~~~~~~~~=[x^{''}_5-x^{'}_5+1,x^{''}_6-x^{'}_6+1,x^{''}_7-x^{'}_7,x^{''}_8-x^{'}_8]\\
    &~~~~~~~~[y^{''}_5-y^{'}_5,y^{''}_6-y^{'}_6,y^{''}_7-y^{'}_7,y^{''}_8-y^{'}_8]\\
    &~~~~~~~~~~~~=[1,0,0,1]\ne [0,0,0,0]\\
    \end{split}
  $$

- To conclude:

  $$
  \begin{split}
    &\text{Summarize the above and combine (I)(II)(III) as:}\\
    &~~~~\text{when the used sorting algorithm is stable as appendix A.9,}\\
    &~~~~\text{if }round(\cdot)~\text{function is as }\eqref{round_1},\text{or }\eqref{round_2},\\
    &~~~~~~~~\text{the result }y\text{ from solution }1,y^{'},\text{ is the same to the result }y\text{ from solution }2,y^{''},\\
    &~~~~\text{if }round(\cdot)~\text{function is as }\eqref{round_3},\\
    &~~~~~~~~\text{there is no guarantee that }y^{'}\text{ is the same to }y^{''}.
    \end{split}
  $$

[^1]: 《IEEE 754》, . 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rule

[^2]: 《IEEE 754》, . 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rule

[^3]: 《IEEE 754》, . 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rule

[^4]: 《IEEE 754》, . 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rule

[^5]: 《IEEE 754》, . 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rule

[^6]: (2022, November 17). Built-in Functions — Python 3.11.0 documentation. Docs. https://docs.python.org/3/library/functions.html?highlight=sorted#sorted

[^7]: (2022, November 17). Sorting algorithm - Wikipedia. En. https://en.wikipedia.org/wiki/Sorting_algorithm#Stability
