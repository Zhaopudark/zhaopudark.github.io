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
updated: "2024-05-16 09:04:49"
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
  \begin{equation}\label{round_f}\tag{5}
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
A.3](#A.3), we can find a conclusion about the function$\eqref{round_f}$
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
    &round(\cdot)\in \{\eqref{round_1}\eqref{round_2},\eqref{round_3}\}\\
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
  \begin{equation}\label{floor}\tag{9}
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
    \begin{equation}\label{floor_f}\tag{10}
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
    function $\eqref{floor_f}$ that: $$
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

- Assertion:
  - Given set $V_1,V_2$, where $\empty \subsetneq V_1 \subseteq V_2$,
  - and given set $U\subset V_2$,
  - so, let $\complement_{V_2}U$ represents the complement of $U$ in
    $V_2$​​​.
  - If $U\cap V_1=\empty$,
  - then, $\complement_{V_2}U \cap V_1 \ne \empty$.
- Proof:
  - Since $U\cap V_1=\empty$.
  - If $U=\empty$,
    - then $\complement_{V_2}U=V_2$.
    - According to the assertion, there is
      $\complement_{V_2}U \cap V_1 = V_2\cap V_1 = V_1\ne \empty$.
  - If $U \ne \empty$,
    - then, $\exists x\in V_1, x\notin U, x \in V_2$.
    - So, $x \in \complement_{V_2}U \cap V_1$,
    - i.e., $\complement_{V_2}U \cap V_1 \ne \empty$.

  Therefore, the [Lemma 1](#lemma 1) is proofed.

## Lemma 2

- Assertion:

  - Given set $V_1,V_2$, where $\empty \subsetneq V_1 \subseteq V_2$,
  - and given set
    $V^{*}_{1}=\{x|\mathop{\arg\min}\limits_{x\in V_1}f(x)\}$,
    $V^{*}_{2}=\{x|\mathop{\arg\min}\limits_{x\in V_2}f(x)\}$.
  - If $\exists x \in V^{*}_{2}$, and $x \in V_1$,
    - then, $x \in V^{*}_{1} \subseteq V^{*}_{2}$.

- Proof:

  - Obviously, there are $V_1^*\subseteq V_1 \subseteq V_2$, and
    $V_2^*\subseteq V_2$.
  - Since $\exists x \in V^{*}_{2}$, and $x \in V_1$,
  - so, $V_1\cap V_2^* \ne \empty$.
  - Assume $\exists \hat x \in V_1\cap V_2^*$ that
    $\hat x \notin V_1^*$,
    - so, $\hat x \in V_2^*, x\in V_1$, but $\hat x \notin V_1^*$.
    - So, $\forall \hat y \in V_1^* \subseteq V_2$, there is
      $f(\hat y)<f(\hat x)$.
    - So, $\hat x \notin V_2^*$, which is contrary to the logic of the
      above.
    - So, the assumption is not valid.
  - So, $\forall \hat x \in V_1\cap V_2^*$, there is $\hat x \in V_1^*$​,
    i.e., $V_1\cap V_2^*\subseteq V_1^*$​.
  - Assume $\exists \hat x \in V_1^*$ that
    $\hat x \notin V_1\cap V_2^*$​,
    - so, $\hat x \in V_1^*, x\in V_1$, but $\hat x \notin V_2^*$​.
    - So, $\forall \hat y \in V_2^* \subseteq V_2$, there is
      $f(\hat y)<f(\hat x)$​.
    - So, $\forall \hat z \in V_1 \cap V_2^* \subseteq V_1$, there is
      $f(\hat z)<f(\hat x)$.
    - So, $\hat x \notin V_1^*$​, which is contrary to the logic of the
      above.
    - So, the assumption is not valid.
  - So, $\forall \hat x \in V_1^*$, there is $\hat x \in V_1\cap V_2^*$,
    i.e., $V_1^* \subseteq V_1\cap V_2^*$.
  - Therefore, $V_1^*=V_1\cap V_2^*$​.
  - So, $x \in V^{*}_{1} \subseteq V^{*}_{2}$

  Therefore, the [Lemma 2](#lemma 2) is proofed.

## A.5

Define a helper function and elaboration some features (conclusions) of
it.

- $\forall p\ge 1,~x \in [-0.5,0.5],~k\in \mathbb{Z}$,

- Define
  $I(k,x) =\begin{cases}|k+x|^{p}-|k+x-1|^{p},~k\ge 1, k \in \mathbb{Z},~x \in [-0.5,0.5]\\
  0,~k=0,~x \in [-0.5,0.5]\\ |k+x|^{p}-|k+x+1|^{p},k\le -1, k \in \mathbb{Z},~x \in [-0.5,0.5]\end{cases}$​

- Analysis:

  - If $k\ge2,k \in \mathbb{Z},~x \in [-0.5,0.5],p\ge 1$,

    - $\frac{\partial I(k,x)}{\partial x}=\frac{\partial[(k+x)^{p}-(k+x-1)^{p}]}{\partial x}=p(k+x)^{p-1}-p(k+x-1)^{p-1}\ge 0$​.
    - ($p=1$ leads to $0$ partial derivative)

  - If $k=1,k \in \mathbb{Z},~x \in [0,0.5],p\ge 1$,

    - $\frac{\partial I(k,x)}{\partial x}=\frac{\partial[(1+x)^{p}-(x)^{p}]}{\partial x}=p(1+x)^{p-1}-p(x)^{p-1}\ge 0$​.

  - If $k=1,k \in \mathbb{Z},~x \in [-0.5,0],p\ge 1$,

    - $\frac{\partial I(k,x)}{\partial x}=\frac{\partial[(1+x)^{p}-(-x)^{p}]}{\partial x}=p(1+x)^{p-1}+p(-x)^{p-1}\ge 0$​.

  - $(I)\rightarrow$ So, when
    $k\ge1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\ge 1$,

    - The function $I(k,x)=(|k+x|^{p}-|k+x-1|^{p})$ is non-strictly
      monotonically increasing W.R.T. $x$.

  - $(II)\rightarrow$ So, $\forall x_1,x_2\in [-0.5,0.5]$,

    - when $k\ge 2$​, there is $$
      \begin{split}
      I(k,x_1)-I(k-1,x_2)&=|k+x_1|^{p}-|k+x_1-1|^{p}-(|k-1+x_2|^{p}-|k+x_2-2|^{p})\\
      &\ge \min_{x_1}(|k+x_1|^{p}-|k+x_1-1|^{p})-\max_{x_2}(|k-1+x_2|^{p}-|k+x_2-2|^{p})\\
      &~= (|k-0.5|^{p}-|k-1.5|^{p})-(|k-0.5|^{p}-|k-1.5|^{p})=0,
      \end{split}
      $$

    - when $k=1$, there is
      $I(k,x_1)-I(k-1,x_2)=|1+x_1|^{p}-|x_1|^{p}-0\ge |1-0.5|^{p}-|-0.5|^{p}=0$​

  - If $k\le -2,k \in \mathbb{Z},~x \in [-0.5,0.5],p\ge 1$,

    - $\frac{\partial I(k,x)}{\partial x}=\frac{\partial[(-k-x)^{p}-(-k-x-1)^{p}]}{\partial x}=-p(-k-x)^{p-1}+p(-k-x-1)^{p-1}\le 0$​.
    - ($p=1$ leads to $0$ partial derivative)

  - If $k=-1,k \in \mathbb{Z},~x \in [0,0.5],p\ge 1$,

    - $\frac{\partial I(k,x)}{\partial x}=\frac{\partial[(1-x)^{p}-(x)^{p}]}{\partial x}=-p(1-x)^{p-1}-p(x)^{p-1}\le 0$​.

  - If $k=-1,k \in \mathbb{Z},~x \in [-0.5,0],p\ge 1$,

    - $\frac{\partial I(k,x)}{\partial x}=\frac{\partial[(1-x)^{p}-(-x)^{p}]}{\partial x}=-p(1-x)^{p-1}+p(-x)^{p-1}\le 0$​.

  - $(III)\rightarrow$ So, when
    $k\le -1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\ge 1$,

    - The function $I(k,x)=(|k+x|^{p}-|k+x+1|^{p})$ is non-strictly
      monotonically decreasing W.R.T. $x$.

  - $(IV)\rightarrow$ So, $\forall x_1,x_2\in [-0.5,0.5]$​,

    - when $k\le-2$, there is $$
      \begin{split}
      I(k,x_1)-I(k+1,x_2)&=|k+x_1|^{p}-|k+x_1+1|^{p}-(|k+1+x_2|^{p}-|k+x_2+2|^{p})\\
      &\ge \min_{x_1}(|k+x_1|^{p}-|k+x_1+1|^{p})-\max_{x_2}(|k+1+x_2|^{p}-|k+x_2+2|^{p})\\
      &~= (|k+0.5|^{p}-|k+1.5|^{p})-(|k+0.5|^{p}-|k+1.5|^{p})=0,
      \end{split}
      $$

    - when $k=-1$, there is
      $I(k,x_1)-I(k+1,x_2)=|-1+x_1|^{p}-|x_1|^{p}-0\ge |-0.5+1|^{p}-|0.5|^{p}\ge 0$.

- To conclude:

  1.  In the circumstance that $k \in \mathbb{Z},p\ge 1$,
      $\forall x_1,x_2,\ldots,x_{\infty}\in [-0.5,0.5]$, there are
      - $0=I(0,x_1)\le I(-1,x_1)\le I(-2,x_2)\le\ldots \le I(-k_{\infty},x_{\infty})$,
      - and,
        $0=I(0,x_1)\le I(1,x_1)\le I(2,x_2)\le\ldots \le I(k_{\infty},x_{\infty})$
  2.  In the circumstance that
      $k\ge 1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\ge 1$, the function
      $I(k,x)$ is non-strictly monotonically increasing W.R.T. $x$.
  3.  In the circumstance that
      $k\le-1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\ge 1$, the function
      $I(k,x)$ is non-strictly monotonically decreasing W.R.T. $x$​.

{% note info %}

`non-strictly monotonically` arises from the fact that $p$ may be equal
to $1$. This feature will greatly affect subsequent reasoning, negating
many intuitively plausible inferences and leaving very weak limits and
conclusions. All of the point is that $p$ may be equal to $1$.

{% endnote %}

## A.6

To proof the $b$ in [solution 1](#Solution 1, based on round() function)
is one of the solutions of problem $\eqref{NIP_problem_round}$.

{% note info %}

For better readability, we divide the proof process into several parts
and analysis step by step, until the conclusion is reached.

{% endnote %}

1.  Preliminary illustrations:

    - Known conditions:

      - $n,N \in \mathbb{Z}^+, n \le N$
      - $p\in \mathbb{R},~p\ge 1$
      - $r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1$​
      - $round(\cdot)\in \{\eqref{round_1},\eqref{round_2},\eqref{round_3}\}$​
      - $m=N-\sum_{i=1}^n round(r_iN)$,
        - From the conclusion $\eqref{round_conclusion}$, there are
          $m \in \mathbb{Z},-\frac{n}{2}\le m\le\frac{n}{2}$.
      - $x=[x_1,x_2,\ldots,x_n], \forall i \in \{1,2,\ldots,n\},x_i = round(r_iN)-r_iN$,
        and $-0.5\le x_1\le x_2\le \ldots \le x_n \le 0.5$​

    - Define $$
      \begin{split}
        B_f=\{b|&b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m,\\&[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n\}
        \end{split}
      $$

    - Define
      $B^{'}_f=\{b|b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m\}$​.

    - Define solutions set
      $B^{*}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B_f}(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}$.

    - Define solutions set
      $B^{*'}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B^{'}_f}(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}$​.

    - There is $\empty \ne B_f$​.

      Proof:

      - If $m\ge 0$, then
        $\exists b=[m,0,\ldots,0]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m$,
        that make
        $[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n$.
      - If $m< 0$,
        - because
          $-\frac{n}{2}\le m=N-\sum_{i=1}^n round(r_iN)\le\frac{n}{2}$,
        - so, \$ *{i=1}^n round(r_iN)-N+*{i=1}^n round(r_iN)\$.
        - therefore,
          $\sum_{i=1}^n round(r_iN)\ge N-\frac{n}{2}\ge n-\frac{n}{2}=\frac{n}{2}\ge |m| = -m$​.
        - let $t=\sum_{i=1}^n round(r_iN)+m\ge0$,
        - then,
          $\exists b=[t-round(r_1N),-round(r_2N),\ldots,-round(r_nN)]\in \mathbb{Z}^n$,
          that make
          $[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]=[t,0,0,\ldots,0]\in \mathbb{N}^n$.
        - Also, $\sum_{i=1}^n b_i=t-\sum_{i=1}^{n}round(r_iN)=m$.
        - so, $b\in B_f$​.

      So, $\empty \ne B_f$ is proofed.

    So, there are
    $B_f\subseteq B^{'}_f, \empty \ne B^{*}_f\subseteq B_f,~\empty\ne B^{*'}_f \subseteq B^{'}_f$

2.  Let
    $B_1= \{b|b=[b_1,b_2,\ldots,b_n] \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m, \exists s,t \in \{1,2,\ldots,n\}, \text{ that } b_s\ge 1,b_t\le -1\}\subseteq B^{'}_f$,
    then there will be
    $\complement_{B^{'}_f}B_1 \cap B^{*'}_f \ne \empty$.

    Proof:

    - If there $\exists b=[b_1,b_2,\ldots,b_n]\in B^{*'}_f\cap B_1$.

      - Without loss of generality, let $s<t$​.

      - So, there is
        $b=[\ldots,b_s,\ldots,b_t,\ldots] \in B^{*'}_f \cap B_1$.

      - Define
        $b^{'}=[\ldots,b^{'}_s,\ldots.,b^{'}_t,\ldots]=[\ldots,b_s-1,\ldots,b_t+1,\ldots]$,
        where
        $b^{'}_s=b_s-1,b^{'}_t=b_t+1, \forall i \in \{i|i \in [1,n], i\in \mathbb{Z}, i \notin \{s,t\}\}, b^{'}_i=b_i$​​.

      - Obviously, there is $b^{'}\in B^{'}_f$.

      - Also, according to helper functions and conclusions in [appendix
        A.5](#A.5), then: $$
        \begin{split}
        &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
        &=|b^{'}_s+x_s |^{p}+|b^{'}_t+x_t|^{p}-|b_s+x_s|^{p}-|b_t+x_t|^{p}\\
        &=|b_s-1+x_s|^{p}+|b_t+1+x_t|^{p}-|b_s+x_s|^{p}-|b_t+x_t|^{p}\\
        &=-(|b_s+x_s|^{p}-|b_s-1+x_s|^{p})-(|b_t+x_t|^{p}-|b_t+1+x_t|^{p})\\
        &=-I(b_s,x_s)-I(b_t,x_t)\\
        &\le -I(0,x_s)-I(0,x_t)\\
        &=0+0=0.
        \end{split}
        $$

      - so,
        $\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}\le \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}$.

      - Therefore,
        $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\le (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$​.

      - So, \$ b<sup>{’}B</sup>{\*’}\_f\$​.

        {% note info %}

        There is $b^{'}\in B_1$ or
        $b^{'}\in\complement_{B^{'}_{f}}{B_1}$. If $b^{'}\in B_1$, we
        use $b^{'}$ to replace $b$ and repeat the above procedure, and
        then get $b^{''}$. Obviously, with a finite number of
        iterations, we must be able to find a $b^{'\cdots'}$, that
        $b^{'\cdots'}\in \complement_{B^{'}_{f}}{B_1}$ and \$
        b<sup>{‘’}B</sup>{\*’}\_f\$.

        {% endnote %}

      - Therefore,
        $\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty$.

    - If $\empty = B^{*'}_f\cap B_1$, according to [Lemma 1](#lemma 1),
      there is $\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty$.

    So, regardless of whether $B^{*'}_f\cap B_1$ is empty or not, there
    will always be
    $\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty$.

    So, `2` is proofed.

3.  Let
    $B_2= \{b|b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m, \exists s \in \{1,2,\ldots,n\},\text{ that } b_s\ge 2~\text{or}~b_s\le -2\}\subseteq B^{'}_f$,
    then there will be
    $\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \ne \empty$.

    Proof:

    - The $\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty$ has
      been proofed in `2`.

    - If there
      $\exists b=[b_1,b_2,\ldots,b_n]\in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2$​.

      - If $\exists s \in \{1,2,\ldots,n\}$, that $b_s\ge 2$.

        - Then, according to $\complement_{B^{'}_f}B_1$’s field, there
          is $\forall i \in \{1,2,\ldots,n\}~b_{i}\ge 0$​.

        - And according to $\eqref{round_conclusion}$, there is
          $0\le \sum_{i=1}^n b_i \le \frac{n}{2}$.

        - So, there $\exists t\ne s$, that $b_t=0$.

        - Without loss of generality, let $s<t$,

        - So,there is $b=[\ldots,b_s,\ldots,b_t,\ldots]$.

        - Define
          $b^{'}=[\ldots,b^{'}_s,\ldots,b^{'}_t,\ldots]=[\ldots,b_s-1,\ldots,b_t+1,\ldots]$,
          where
          $b^{'}_s=b_s-1,b^{'}_t=b_t+1, \forall i \in \{i|i \in [1,n], i\in \mathbb{Z}, i \notin \{s,t\}\}, b^{'}_i=b_i$.

        - Obviously, there is $b^{'}\in \complement_{B^{'}_f}B_1$​.

        - Also, according to helper functions and conclusions in
          [appendix A.5](#A.5), then: $$
          \begin{split}
          &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
          &=|b^{'}_s+x_s|^{p}+|b^{'}_t+x_t|^{p}-|b_s+x_s|^{p}-|b_t+x_t|^{p}\\
          &=|b_s-1+x_s|^{p}+|b_t+1+x_t|^{p}-|b_s+x_s|^{p}-|b_t+x_t|^{p}\\
          &=-(|b_s+x_s|^{p}-|b_s-1+x_s|^{p})+(|b_t+1+x_t|^{p}-|b_t+x_t|^{p})\\
          &=-I(b_s,x_s)+I(b_t+1,x_t)\\
          &=-[I(b_s,x_s)-I(1,x_t)]\\
          &\le0.
          \end{split}
          $$

      - Similarly, if $\exists s \in \{1,2,\ldots,n\}$, that
        $b_s\le -2$.

        - Then, according to $\complement_{B^{'}_f}B_1$’s field, there
          is $\forall i \in \{1,2,\ldots,n\}~b_{i}\le 0$​.

        - And according to $\eqref{round_conclusion}$, there is
          $0\ge \sum_{i=1}^n b_i \ge -\frac{n}{2}$.

        - So, there $\exists t\ne s$, that $b_t=0$​.

        - Without loss of generality, let $s<t$,

        - So,there is $b=[\ldots,b_s,\ldots,b_t,\ldots]$.

        - Define
          $b^{'}=[\ldots,b^{'}_s,\ldots,b^{'}_t,\ldots]=[\ldots,b_s+1,\ldots,b_t-1,\ldots]$,
          where
          $b^{'}_s=b_s+1,b^{'}_t=b_t-1, \forall i \in \{i|i \in [1,n], i\in \mathbb{Z}, i \notin \{s,t\}\}, b^{'}_i=b_i$.

        - Obviously, there is $b^{'}\in \complement_{B^{'}_f}B_1$​.

        - Also, according to helper functions and conclusions in
          [appendix A.5](#A.5), then: $$
          \begin{split}
          &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
          &=|b^{'}_s+x_s|^{p}+|b^{'}_t+x_t|^{p}-|b_s+x_s|^{p}-|b_t+x_t|^{p}\\
          &=|b_s+1+x_s|^{p}+|b_t-1+x_t|^{p}-|b_s+x_s|^{p}-|b_t+x_t|^{p}\\
          &=-(|b_s+x_s|^{p}-|b_s+1+x_s|^{p})+(|b_t-1+x_t|^{p}-|b_t+x_t|^{p})\\
          &=-I(b_s,x_s)+I(b_t-1,x_t)\\
          &=-[I(b_s,x_s)-I(-1,x_t)]\\
          &\le0.
          \end{split}
          $$

      - So, regardless of whether $\exists s$, that $b_s\ge 2$ or
        $b_s\le -2$, there is
        $\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}\le \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}$.

      - Therefore,
        $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\le (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.

      - So, $b^{'}\in B^{*'}_f$​.

        {% note info %}

        There is $b^{'}\in \complement_{B^{'}_f}B_1\cap B_2$ or
        $b^{'}\in\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}$.
        If $b^{'}\in \complement_{B^{'}_f}B_1\cap B_2$, we use $b^{'}$
        to replace $b$ and repeat the above procedure, and then get
        $b^{''}$. Obviously, with a finite number of iterations, we must
        be able to find a $b^{'\cdots'}$, that
        $b^{'\cdots'}\in \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}$
        and \$ b<sup>{‘’}B</sup>{\*’}\_f\$.

        {% endnote %}

      - Therefore,
        $\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \ne \empty$​.

    - If $\empty = \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2$,
      according to [Lemma 1](#lemma 1), there is
      $\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \ne \empty$.

    So, regardless of whether
    $\complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2$ is empty or not,
    there will always be
    $\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \ne \empty$.

    So, `3` is proofed.

4.  Let
    $B_3= \{b|b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m, \exists s,t \in \{1,2,\ldots,n \} s < t, x_s < x_t,\text{ that }0 \le b_s<b_t,\text{ or }b_s < b_t \le 0\}\subseteq B^{'}_{f}$,
    then there will be
    $\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_f}B_2\cap\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty$.

    Proof:

    - The
      $\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \ne \empty$​​
      has been proofed in `3`.

    - If there
      $\exists b=[b_1,b_2,\ldots,b_n]\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f\cap B_3$.

      - If $\exists s,t \in \{1,2,\ldots,n \} s < t, x_s < x_t$, that
        $0 \le b_s < b_t$.

        - Then, according to
          $\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}$’s
          field, there is
          $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,1\}$​.

        - So, $b_s=0, b_t = 1$.

        - So, there is $b=[\ldots,b_s,\ldots,b_t,\ldots]$.

        - Define
          $b^{'}=[\ldots,b^{'}_s,\ldots,b^{'}_t,\ldots]=[\ldots,b_s+1,\ldots,b_t-1,\ldots]$,
          where
          $b^{'}_s=b_s+1,b^{'}_t=b_t-1, \forall i \in \{i|i \in [1,n], i\in \mathbb{Z}, i \notin \{s,t\}\}, b^{'}_i=b_i$.

        - Obviously, there is
          $\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1$​.

        - Also, according to helper functions and conclusions in
          [appendix A.5](#A.5), then: $$
          \begin{split}
          &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
          &=|b^{'}_s+x_s|^{p}+|b^{'}_t+x_t|^{p}-|b_s+x_s|^{p}-|b_t+x_t|^{p}\\
          &=|b_s+1+x_s|^{p}+|b_t-1+x_t|^{p}-|b_s+x_s|^{p}-|b_t+x_t|^{p}\\
          &=(|b_s+1+x_s|^{p}-|b_s+x_s|^{p})-(|b_t+x_t|^{p}-|b_t-1+x_t|^{p})\\
          &=I(b_t+1,x_s)-I(b_t,x_t)\\
          &=I(1,x_s)-I(1,x_t)\\
          &\le 0.
          \end{split}
          $$

      - Similarly, if
        $\exists s,t \in \{1,2,\ldots,n \} s < t, x_s < x_t$, that
        $b_s < b_t \le 0$​.

        - Then, according to
          $\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}$’s
          field, there is
          $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,-1\}$​.

        - So，$b_s=-1, b_t = 0$.

        - So, there is $b=[\ldots,b_s,\ldots,b_t,\ldots]$.

        - Define
          $b^{'}=[\ldots,b^{'}_s,\ldots,b^{'}_t,\ldots]=[\ldots,b_s+1,\ldots,b_t-1,\ldots]$,
          where
          $b^{'}_s=b_s+1,b^{'}_t=b_t-1, \forall i \in \{i|i \in [1,n], i\in \mathbb{Z}, i \notin \{s,t\}\}, b^{'}_i=b_i$​.

        - Obviously, there is
          $\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1$​.

        - Also, according to helper functions and conclusions in
          [appendix A.5](#A.5), then: $$
          \begin{split}
          &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
          &=|b^{'}_s+x_s|^{p}+|b^{'}_t+x_t|^{p}-|b_s+x_s|^{p}-|b_t+x_t|^{p}\\
          &=|b_s+1+x_s|^{p}+|b_t-1+x_t|^{p}-|b_s+x_s|^{p}-|b_t+x_t|^{p}\\
          &=-(|b_s+x_s|^{p}-|b_s+1+x_s|^{p})+(|b_t-1+x_t|^{p}-|b_t+x_t|^{p})\\
          &=-I(b_s,x_s)+I(b_t-1,x_t)\\
          &=-I(-1,x_s)+I(-1,x_t)\\
          &\le 0.
          \end{split}
          $$

      - So, regardless of whether
        $\exists s,t \in \{1,2,\ldots,n \} s < t, x_s \le x_t$, that
        $0 \le b_s < b_t$ or $b_s < b_t \le 0$, there is
        $\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}\le \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}$​.

      - Therefore,
        $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\le (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$​.

      - So, $b^{'}\in B^{*'}_f$.

        {% note info %}

        There is
        $b^{'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap B_3$
        or
        $b^{'}\in\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3}$.
        If
        $b^{'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap B_3$,
        we use $b^{'}$ to replace $b$ and repeat the above procedure,
        and then get $b^{''}$. Obviously, with a finite number of
        iterations, we must be able to find a $b^{'\cdots'}$, that
        $b^{'\cdots'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3}$
        and \$ b<sup>{‘’}B</sup>{\*’}\_f\$​.

        {% endnote %}

      - Therefore,
        $\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_f}B_2\cap\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty$​.

    - If
      $\empty = \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f\cap B_3$,
      according to [Lemma 1](#lemma 1), there is
      $\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_f}B_2\cap\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty$​.

    So, regardless of whether
    $\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f\cap B_3$
    is empty or not, there will always be
    $\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_f}B_2\cap\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \ne \empty$​.

    So, `4` is proofed.

5.  Consider a special $b$​

    - Known:
      $B_1= \{b|b=[b_1,b_2,\ldots,b_n] \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m, \exists s,t \in \{1,2,\ldots,n\}, \text{ that } b_s\ge 1,b_t\le -1\}\subseteq B^{'}_f$.

    - Known:
      $B_2= \{b|b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m, \exists s \in \{1,2,\ldots,n\},\text{ that } b_s\ge 2~\text{or}~b_s\le -2\}\subseteq B^{'}_f$.

    - Known:
      $B_3= \{b|b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m, \exists s,t \in \{1,2,\ldots,n \} s < t, x_s < x_t,\text{ that }0 \le b_s<b_t,\text{ or }b_s < b_t \le 0\}\subseteq B^{'}_{f}$.

    - Define
      $B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1$​.

    - Known:
      $x = [x_1,x_2,\ldots,x_n], x_i = round(r_iN)-r_iN,-0.5\le x_1\le x_2\le \ldots \le x_n \le 0.5$.

    - Known: $m=N-\sum_{i=1}^n round(r_iN)$, and from
      $\eqref{round_conclusion}$, there are
      $m \in \mathbb{Z},\text{and }-\frac{n}{2}\le m\le\frac{n}{2}$​. $$
      \begin{split}
        &\text{Let } b=[b_1,b_2,\ldots,b_n]\\
        &(1)~\text{If }m>0, \text{ then }\forall i \in \{i|i \in [1,|m|], i \in \mathbb{Z}^+\} b_i = 1, \forall j \in \{j|j \in [|m|+1,n], j \in \mathbb{Z}^+\} b_j = 0.\\
        &(2)~\text{If }m=0, \text{ then }\forall i \in \{i|i \in [1,n], i \in \mathbb{Z}^+\} b_i = 0.\\
        &(3)~\text{If }m<0, \text{ then }\forall i \in \{i|i \in [1,n-|m|], i \in \mathbb{Z}^+\} b_i = 0, \forall j \in \{j|j \in [n-|m|+1,n], j \in \mathbb{Z}^+\} b_j = -1.
        \end{split}
      $$

    - Obviously,
      $b\in B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1$.

6.  The special $b$ defined in `5` satisfies $b\in B^{*'}_{f}$.

    Proof:

    - Since
      $b\in B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1$​​.

    - Define a mapping
      $f(i,\delta):\{\mathbb{Z}^+,\mathbb{Z}^-\cup\mathbb{Z}^+\}\rightarrow \mathbb{Z}^n$:

      - $\forall (i,\delta) \in \{(i,\delta)|i\in\mathbb{Z}^+,i\le n,\delta \in \mathbb{Z}^-\cup\mathbb{Z}^+\}$
      - \$f(i,)=\[f_1,f_2,,f_n\]^n, f_i=,x {x\|x,x, x i} f_x = 0 \$.

    - If $\exists b^{'}=[b^{'}_1,b^{'}_2,\ldots,b^{'}_n]\in B_t$, that
      \$ b^{’}b\$​​.

      - If $m>0$, so, $b=[1,1,\ldots,1,0,0,\ldots,0]$, where \$ i {i\|i
        , i ^+} b_i = 1, j {j\|j , j ^+} b_j = 0\$

        - Then, according to $B_t$’s field, there is
          $\forall i \in \{1,2,\ldots,n\}~b^{'}_{i}\in \{0,1\}$​.

        - Without loss of generality, let
          $b^{'} = b+f(s_1,-1)+f(s_2,-1)+\ldots+f(s_k,-1)+f(t_1,1)+f(t_2,1)+\ldots+f(t_k,1)$,
          where
          $k \in \{k|k\in \mathbb{Z}^+, k\le \min(|m|,n-|m|)=|m|\},~1\le s_1<s_2<\ldots<s_k \le |m|< t_1<t_2<\ldots<t_k\le n$,
          and $\forall i\in \{1,2,\ldots,k\}~s_i,t_i \in \mathbb{Z}$​

        - $(I)\rightarrow$ So, $\forall i\in \{1,2,\ldots,k\}$, there
          are
          $b_{s_i}=1,b_{t_i}=0,b^{'}_{s_i}=b_{s_i}-1=0,b^{'}_{t_i}=b_{t_i}+1=1$,
          $x_{s_i}\le x_{t_i}$and according to helper functions and
          conclusions in [appendix A.5](#A.5), then: $$
          \begin{split}
          &\sum_{i=1}^k(|round(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p})\\
          &~~~~-\sum_{i=1}^k(|round(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p})\\
          &=\sum_{i=1}^k(|round(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p}\\
          &~~~~-|round(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p})\\
          &=\sum_{i=1}^k[|round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)+1-r_{t_i}N |^{p}\\
          &~~~~-(|round(r_{s_i}N)+1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p})]\\
          &=\sum_{i=1}^k[-(|round(r_{s_i}N)+1-r_{s_i}N |^{p}-|round(r_{s_i}N)-r_{s_i}N|^{p})\\
          &~~~~+(|round(r_{t_i}N)+1-r_{t_i}N |^{p}-|round(r_{t_i}N)-r_{t_i}N |^{p})]\\
          &=\sum_{i=1}^k[-I(1,round(r_{s_i}N)-r_{s_i}N)+I(1,round(r_{t_i}N)-r_{t_i}N)]\\
          &=\sum_{i=1}^k[-I(1,x_{s_i})+I(1,x_{t_i})]\\
          & \ge 0
          \end{split}
          $$

        - Assume the $b^{'}$ make
          $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}<(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$​​.

        - So,
          $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})<(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})$​,

        - So, eliminate the identical terms, there will be: $$
          \begin{split}
          &\sum_{i=1}^k(|round(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p})\\
          &<\sum_{i=1}^k( |round(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p})
          \end{split}
          $$ which is contradictory to $(I)$, so the above assumption is
          not valid.

        - So, $\forall b^{'}=[b^{'}_1,b^{'}_2,\ldots,b^{'}_n]\in B_t$,
          that \$ b^{’}b\$, there will always be
          $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ge (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.

        - So, $b\in B^{*'}_{f}$.

      - If $m=0$, obviously,
        $B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1$
        is a single-element set, there is $\nexists b^{'} \in B_t$, that
        $b^{'}\ne b$. Omitted.

      - If $m < 0$, so, $b=[0,0,\ldots,-1,-1,\ldots,-1]$, where
        $\forall i \in \{i|i \in [1,n-|m|], i \in \mathbb{Z}^+\} b_i = 0, \forall j \in \{j|j \in [n-|m|+1,n], j \in \mathbb{Z}^+\} b_j = -1$.

        - Then, according to $B_t$’s field, there is
          $\forall i \in \{1,2,\ldots,n\}~b^{'}_{i}\in \{0,-1\}$.

        - Without loss of generality, let
          $b^{'} = b+f(s_1,-1)+f(s_2,-1)+\ldots+f(s_k,-1)+f(t_1,1)+f(t_2,1)+\ldots+f(t_k,1)$,
          where
          $k \in \{k|k\in \mathbb{Z}^+, k\le \min(|m|,n-|m|)=|m|\},~1\le s_1<s_2<\ldots<s_k < n-|m|+1 \le t_1<t_2<\ldots<t_k\le n$,
          and $\forall i\in \{1,2,\ldots,k\}~s_i,t_i \in \mathbb{Z}$.

        - $(II)\rightarrow$ So, $\forall i\in \{1,2,\ldots,k\}$, there
          are
          $b_{s_i}=0,b_{t_i}=-1,b^{'}_{s_i}=b_{s_i}-1=-1,b^{'}_{t_i}=b_{t_i}+1=0$,
          $x_{s_i}\le x_{t_i}$​and according to helper functions and
          conclusions in [appendix A.5](#A.5), then: $$
          \begin{split}
          &\sum_{i=1}^k(|round(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p})\\
          &~~~~-\sum_{i=1}^k(|round(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p})\\
          &=\sum_{i=1}^k(|round(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p}\\
          &~~~~-|round(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p})\\
          &=\sum_{i=1}^k[|round(r_{s_i}N)-1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p}\\
          &~~~~-(|round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)-1-r_{t_i}N |^{p})]\\
          &=\sum_{i=1}^k[(|round(r_{s_i}N)-1-r_{s_i}N |^{p}-|round(r_{s_i}N)-r_{s_i}N|^{p})\\
          &~~~~-(|round(r_{t_i}N)-1-r_{t_i}N |^{p}-|round(r_{t_i}N)-r_{t_i}N |^{p})]\\
          &=\sum_{i=1}^k[I(-1,round(r_{s_i}N)-r_{s_i}N)-I(-1,round(r_{t_i}N)-r_{t_i}N)]\\
          &=\sum_{i=1}^k[I(-1,x_{s_i})-I(-1,x_{t_i})]\\
          & \ge 0
          \end{split}
          $$

        - Assume the $b^{'}$ make
          $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}<(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$​​.

        - So,
          $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})<(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})$​,

        - So, eliminate the identical terms, there will be: $$
          \begin{split}
          &\sum_{i=1}^k(|round(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p})\\
          &<\sum_{i=1}^k( |round(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p})
          \end{split}
          $$ which is contradictory to $(II)$, so the above assumption
          is not valid.

        - So, $\forall b^{'}=[b^{'}_1,b^{'}_2,\ldots,b^{'}_n]\in B_t$,
          that \$ b^{’}b\$, there will always be
          $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ge (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.

        - So, $b\in B^{*'}_{f}$

    - If $B_t=\{b\}$, and in `4`, it has been proofed that
      $B_t \cap B^{*'}_f \ne \empty$, so, there is $b\in B^{*'}_{f}$​.

      Therefore, regardless of the $B_t$ is a single-element set or not,
      or what the value of $m$ is, the $b$ will always satisfied
      $b\in B^{*'}_{f}$.

    So, `6` is proofed.

7.  The special $b$ defined in `5` satisfies
    $b\in B_f \subseteq B^{'}_f$​.

    Proof:

    - Known:
      $x = [x_1,x_2,\ldots,x_n], x_i = round(r_iN)-r_iN,-0.5\le x_1\le x_2\le \ldots \le x_n \le 0.5$.

    - Known: $m=N-\sum_{i=1}^n round(r_iN)$, and from
      $\eqref{round_conclusion}$, there are
      $m \in \mathbb{Z},\text{and }-\frac{n}{2}\le m\le\frac{n}{2}$​.

    - Consider $b=[b_1,b_2,\ldots,b_n]$. It is equivalent to proving
      that $b$ satisfies the constrain of
      $[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n$.

      - If $m>0$, so, $b=[1,1,\ldots,1,0,0,\ldots,0]$, where \$ i {i\|i
        , i ^+} b_i = 1, j {j\|j , j ^+} b_j = 0\$​.
        - Obviously, the constrain of
          $[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n$
          is satisfied.
      - If $m=0$, so, $b=[b_1,b_2,\ldots,b_n]=[0,0,\ldots,0]$.
        - Obviously, the constrain of
          $[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n$
          is satisfied.
      - If $m<0$, so, $b=[0,0,\ldots,-1,-1,\ldots,-1]$, where
        $\forall i \in \{i|i \in [1,n-|m|], i \in \mathbb{Z}^+\} b_i = 0, \forall j \in \{j|j \in [n-|m|+1,n], j \in \mathbb{Z}^+\} b_j = -1$​.
        - Since $b\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m$, so
          $m\in \mathbb{Z}^-$.
        - So, $\sum_{i=1}^n x_i=-m \ge 1$
        - Also because $-0.5 \le x_1\le x_2\le \ldots \le x_n \le 0.5$,
          there will be
          $\forall i \in \{n-2|m|+1,n-2|m|+2,\ldots,n\}~x_{i}=round(r_iN)-r_iN > 0$​.
        - So,
          $\forall i \in \{n-2|m|+1,n-2|m|+2,\ldots,n\}~round(r_iN) \ge 1$​.
        - And, there is $n-2|m|\le n-|m|$, so
          - $\forall i \in \{i|i \in [1,n-2|m|], i \in \mathbb{Z}^+\} round(r_iN)+b_i=round(r_iN)+0=round(r_iN) \ge 0$
          - $\forall i \in \{i|i \in [n-2|m|+1,n-|m|], i \in \mathbb{Z}^+\} round(r_iN)+b_i=round(r_iN)+0=round(r_iN) \ge 1$
          - $\forall i \in \{i|i \in [n-|m|+1,n], i \in \mathbb{Z}^+\} round(r_iN)+b_i=round(r_iN)+1 \ge -1+1 =0$
        - Therefore, the constrain of
          $[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n$​
          is satisfied.

      So, regardless of the value of $m$, the $b$ will always satisfy
      the constrain of
      $[round(r_1N)+b_1,round(r_2N)+b_2,\ldots,round(r_nN)+b_n]\in \mathbb{N}^n$,
      i.e., the $b$ defined in `5` satisfies
      $b\in B_f \subseteq B^{'}_f$​.

    So, `7` is proofed.

8.  Final conclusion:

    - To proof the $b$ in [solution
      1](#Solution 1, based on round() function) is one of the solutions
      of problem $\eqref{NIP_problem_round}$. Some known conditions,
      definitions and basic analyses are put on `1`, especially, the
      $b$’s feasibility domain and the domain’s super set, i.e.,
      $B_f \subseteq B^{'}_f$ , with the corresponding solution set
      $B^{*}_f$ and $B^{*'}_f$.

    - The parts, “`2`, `3`, `4`”, jointly give a restricted feasible
      domain
      $B_t=\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1$.
      And it is proofed that the $B_t\cap B^{*'}_f \ne \empty$.

      - A $b \in B_t$ (the same to [solution
        1](#Solution 1, based on round() function)) is given in `5`, and
        it is proofed that $b\in B^{*'}_{f}$​ in `6`.

    - The $b\in B_f \subseteq B^{'}_f$ is proofed in `7`.

      - Therefore, according to [lemma 2](#Lemma 2), there is
        $b\in B^{*}_f \subseteq B^{*'}_f$.

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

## A.x

Define a helper function and elaboration some features (conclusions) of
it.

- Let: $D_{[-1,0]}=\{x|-1\le x \le 0, x \in R\}$

- $\forall p> 1$, define $I(x,k):\{D,\mathbb{Z}\}\rightarrow \mathbb{R}$
  as

- $I(k,x) =\begin{cases}|k+x|^{p}-|k+x-1|^{p},~k\ge 1, k \in \mathbb{Z},~x \in D_{[-1,0]}\\ -1,~k=0,~x \in D_{[-1,0]}\\ |k+x|^{p}-|k+x+1|^{p},k\le -1, k \in \mathbb{Z},~x \in D_{[-1,0]}\end{cases}$

- Analysis:

  $\forall p> 1$

  - If $k\ge2,k \in \mathbb{Z},~x \in D_{[-1,0]}$,

    - then, $k+x \ge 1 >0, k+x-1 \ge 0$.
    - $I(k,x)=|k+x|^{p}-|k+x-1|^{p}=(k+x)^p-(k+x-1)^p$
    - $\frac{\partial I(k,x)}{\partial x}=p(k+x)^{p-1}-p(k+x-1)^{p-1}> 0$

  - If $k=1,~x \in D_{[-1,0]}$,

    - then, $k+x=1+x \ge 0, k+x-1=x\le 0$.

    - $I(k,x)=|1+x|^{p}-|x|^{p}=(1+x)^p-(-x)^p$

    - $\frac{\partial I(k,x)}{\partial x}=p(1+x)^{p-1}+p(-x)^{p-1}> 0$.

  - If $k\le -2,k \in \mathbb{Z},~x \in D_{[-1,0]}$,

    - then, $k+x \le -2 < 0, k+x+1 \le -1 <0$.
    - $I(k,x)=|k+x|^{p}-|k+x+1|^{p}=(-k-x)^p-(-k-x-1)^p$
    - $\frac{\partial I(k,x)}{\partial x}=-p(-k-x)^{p-1}+p(-k-x-1)^{p-1} = -p[(-k-x)^{p-1}-(-k-x-1)^{p-1}]< 0$.

  - If $k=-1,~x \in D_{[-1,0]}$,

    - then, $k+x = -1+x \le -1 < 0, k+x+1 = x \le 0$
    - $I(k,x)=|-1+x|^{p}-|x|^{p}=(1-x)^p-(-x)^p$
    - $\frac{\partial I(k,x)}{\partial x}=-p(1-x)^{p-1}+p(-x)^{p-1}=-p[(1-x)^{p-1}-(-x)^{p-1}]< 0$.

  - $(I)\rightarrow$ So, when
    $k\ge1,k \in \mathbb{Z},~x \in D_{[-1,0]},p> 1$, the function
    $I(k,x)=(|k+x|^{p}-|k+x-1|^{p})$ is strictly monotonically
    increasing W.R.T. $x$.

  - $(II)\rightarrow$ So, when
    $k\le -1,k \in \mathbb{Z},~x \in D_{[-1,0]},p> 1$, the function
    $I(k,x)=(|k+x|^{p}-|k+x+1|^{p})$ is strictly monotonically
    decreasing W.R.T. $x$.

  Then, consider the region $D_{(-1,0]}=\{x|-1< x \le 0, x \in R\}$
  instead of $D_{[-1,0]}$.

  $\forall x_1,x_2\in D_{(-1,0]}$:

  - When $k\ge 2$, according to $(I)$, there is: $$
    \begin{split}
    \inf_{x_1,x_2\in D_{(-1,0]}}[I(k,x_1)-I(k-1,x_2)]&=\inf_{x_1\in D_{(-1,0]}}I(k,x_1)-\sup_{x_2\in D_{(-1,0]}}I(k-1,x_2)\\
    &= \inf_{x_1\in D_{(-1,0]}}I(k,x_1)-\max_{x_2\in D_{(-1,0]}}I(k-1,x_2)\\
    &= I(k,-1)-I(k-1,0)\\
    &= (|k-1|^{p}-|k-2|^{p})-(|k-1|^{p}-|k-2|^{p})=0,
    \end{split}
    $$

    - And obviously, $\nexists x1,x2 \in (0,1]$, that make
      $I(k,x_1)-I(k-1,x_2)=0$.
    - Therefore, $I(k,x_1)>I(k-1,x_2)$.

  - When $k=1$, according to $(I)$, there is: $$
    \begin{split}
    \inf_{x_1,x_2\in D_{(-1,0]}}[I(k,x_1)-I(k-1,x_2)]&=\inf_{x_1,x_2\in D_{(-1,0]}}[I(1,x_1)-I(0,x_2)]\\
    &=\inf_{x_1\in D_{(-1,0]}}[I(1,x_1)+1]\\
    &=\inf_{x_1\in D_{(-1,0]}}I(1,x_1)+1\\
    &= I(1,-1)+1\\
    &= (|1-1|^{p}-|-1|^{p})+1=0,
    \end{split}
    $$

    - And obviously, $\nexists x1,x2 \in D_{(-1,0]}$, that make
      $I(k,x_1)-I(k-1,x_2)=0$.
    - Therefore, $I(k,x_1)>I(k-1,x_2)$.

  - $(III)\rightarrow$ So, when $k\ge1,k \in \mathbb{Z},p> 1$,
    $\forall x_1,x_2\in D_{(-1,0]}$, there is $I(k,x_1)>I(k-1,x_2)$

  - When $k\le -2$, according to $(II)$, there is: $$
    \begin{split}
    \inf_{x_1,x_2\in D_{(-1,0]}}[I(k,x_1)-I(k+1,x_2)]&=\inf_{x_1\in D_{(-1,0]}}I(k,x_1)-\sup_{x_2\in D_{(-1,0]}}I(k+1,x_2)\\
    &= \min_{x_1\in D_{(-1,0]}}I(k,x_1)-\sup_{x_2\in D_{(-1,0]}}I(k+1,x_2)\\
    &= I(k,0)-I(k+1,-1)\\
    &= (|k|^{p}-|k+1|^{p})-(|k|^{p}-|k+1|^{p})=0,
    \end{split}
    $$

    - And obviously, $\nexists x1,x2 \in D_{(-1,0]}$, that make
      $I(k,x_1)-I(k+1,x_2)=0$.
    - Therefore, $I(k,x_1)>I(k+1,x_2)$.

  - When $k= -1$, according to $(II)$, there is: $$
    \begin{split}
    \inf_{x_1,x_2\in D_{(-1,0]}}[I(k,x_1)-I(k+1,x_2)]&=\inf_{x_1,x_2\in D_{(-1,0]}}[I(-1,x_1)-I(0,x_2)]\\
    &=\inf_{x_1\in D_{(-1,0]}}[I(-1,x_1)+1]\\
    &=\min_{x_1\in D_{(-1,0]}}I(-1,x_1)+1\\
    &= I(0,-1)+1\\
    &= (|-1|^{p}-|0|^{p})+1=2>0,
    \end{split}
    $$

    - Therefore, $I(k,x_1)>I(k+1,x_2)$.

  - $(IV)\rightarrow$ So, when $k\le -1,k \in \mathbb{Z},p> 1$,
    $\forall x_1,x_2\in D_{(-1,0]}$, there is $I(k,x_1)>I(k+1,x_2)$

  According to $(III)$ and $(IV)$, there is:

  - When $k \in \mathbb{Z},p> 1$,
    $\forall x_1,x_2,\ldots,x_{\infty}\in D_{(-1,0]}$,
  - $-1=I(0,x_1)< I(-1,x_1)< I(-2,x_2)<\ldots < I(-\infty,x_{\infty})$,
  - and $-1=I(0,x_1)< I(1,x_1)< I(2,x_2)<\ldots < I(\infty,x_{\infty})$.

## A.8

To proof the $b$ in [solution 2](#Solution 2, based on floor() function)
is one of the solutions of problem $\eqref{NIP_problem_round}$​.

{% note info %}

For better readability, we divide the proof process into several parts
and analysis step by step, until the conclusion is reached.

{% endnote %}

1.  Preliminary illustrations:

    - Known conditions:

      - $n,N \in \mathbb{Z}^+, n \le N$
      - $p\in \mathbb{R},~p> 1$
      - $r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1$​
      - $floor(\cdot)$ is as $\eqref{floor}$
      - $m=N-\sum_{i=1}^n floor(r_iN)$,​​​
        - From the conclusion $\eqref{floor_conclusion}$​, there are
          $m \in \mathbb{Z},0 \le m < n$​.
      - $x=[x_1,x_2,\ldots,x_n], \forall i \in \{1,2,\ldots,n\},x_i = floor(r_iN)-r_iN$​.

    - Group $\{x_1,x_2,\ldots,x_n\}$ according their values as:

      - $\exists h\in \mathbb{Z}^+, h\le n, g_1,g_2,\ldots, g_h \in \mathbb{Z}^+,\sum_{i=1}^{h}g_i=n$,
        that make
        - $G_1 = \{i_1,i_2,\ldots,i_{g_1}\} \subseteq \{1,2,\ldots,n\}, \forall i_s,i_t \in G_1, x_{i_s}=x_{i_t}$.
        - $G_2 = \{i_{g_1+1},i_{g_1+1},\ldots,i_{g_1+g_2}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_2, x_{i_s}=x_{i_t}$.
        - …
        - $G_h = \{i_{1+\sum_{i=1}^{h-1}g_i},i_{2+\sum_{i=1}^{h-1}g_i},\ldots,i_{\sum_{i=1}^{h}g_i}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_h, x_{i_s}=x_{i_t}$.
        - $G_1 \cup G_2 \cup \ldots \cup G_h = \{1,2,\ldots,n\}$
        - $\forall s,t \in \{1,2,\ldots,h\}$ and $s\ne t$, there is
          $G_s \cap G_t \ne \empty$
        - $\forall s,t \in \{1,2,\ldots,h\}, s<t$, there is
          $\forall i_s \in G_s, i_t \in G_t$, that $x_{i_s}<x_{i_t}$.
        - Specially, if $h=1$, there will be
          $\forall i_s,i_t \in \{1,2,\ldots,n\}, x_{i_s}=x_{i_t}$

    - Define $$
      \begin{split}
      B_f=\{b|&b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m,\\&[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n\}
      \end{split}
      $$

    - Define
      $B^{'}_f=\{b|b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m\}$​.

    - Define solutions set
      $B^{*}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B_f}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}$.

    - Define solutions set
      $B^{*'}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B^{'}_f}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}$.

    - There is $\empty \ne B_f$​.

      Proof:

      - Since $m\ge 0$, so,
        $\exists b=[m,0,\ldots,0]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m$,
        that make
        $[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n$.

      So, $\empty \ne B_f$ is proofed.

    So, there are
    $B_f\subseteq B^{'}_f, \empty \ne B^{*}_f\subseteq B_f,~\empty\ne B^{*'}_f \subseteq B^{'}_f$

2.  Let
    $B_1= \{b|b\in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m, \exists i_s,i_t \in \{1,2,\ldots,n\}~b_{i_s}\ge 1,b_{i_t}\le -1\}\subseteq B^{'}_f$,
    then there will be $B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_1$.

    Proof:

    - Obviously, $B_1 \ne \empty$.

    - Assume that there
      $\exists b=[b_1,b_2,\ldots,b_n]\in B^{*'}_f\cap B_1$.

    - Without loss of generality, let $s<t$​.

    - Define $b^{'}=[b^{'}_{1},b^{'}_{2},\ldots,b^{'}_{n}]$, where
      $b^{'}_{i_s}=b_{i_s}-1,b^{'}_{i_t}=b_{i_t}+1, \forall i \in \{i|i \in [1,n], i\in \mathbb{Z}, i \notin \{i_s,i_t\}\}, b^{'}_i=b_i$.

    - Obviously,there are:

      - $b^{'}\in B^{'}_f$,

      - $(I)\rightarrow$ and
        $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ge (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.

    - Also, according to helper functions and conclusions in [appendix
      A.x](#A.x), then: $$
      \begin{split}
      &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
      &=|b^{'}_{i_s}+x_{i_s} |^{p}+|b^{'}_{i_t}+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
      &=|b_{i_s}-1+x_{i_s}|^{p}+|b_{i_t}+1+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
      &=-(|b_{i_s}+x_{i_s}|^{p}-|b_{i_s}-1+x_{i_s}|^{p})-(|b_{i_t}+x_{i_t}|^{p}-|b_{i_t}+1+x_{i_t}|^{p})\\
      &=-I(b_{i_s},x_{i_s})-I(b_{i_t},x_{i_t})\\
      &<-\inf_{x\in(-1,0]}I(b_{i_s},x)-\inf_{x\in(-1,0]}I(b_{i_t},x)\\
      &=-I(b_{i_s},-1)-I(b_{i_t},0)\\
      &=-(|b_{i_s}-1|^{p}-|b_{i_s}-2|^{p})-(|b_{i_t}|^{p}-|b_{i_t}+1|^{p})\\
      &< 0\\
      \end{split}
      $$

    - so,
      $\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}< \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}$.

    - Therefore,
      $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} < (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$,
      which is contradictory to $(I)$​, so the above assumption is not
      valid.

    - So, $B^{*'}_f\cap B_1 = \empty$, i.e.,
      $B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_1$​.

    So, `2` is proofed.

3.  Let
    $B_2= \{b|b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m,\exists i_s \in \{1,2,\ldots,n\}~b_{i_s}\ge 2\}\subseteq B^{'}_f$,
    then there will
    be,$B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2$.

    Proof:

    - Obviously, $B_2 \ne \empty$.

    - Assume that there
      $\exists b=[b_1,b_2,\ldots,b_n]\in B^{*'}_f \cap B_2$​​​.

    - So, $\exists i_s \in \{1,2,\ldots,n\}$, that $b_{i_s}\ge 2$.

    - The $B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_1$ has been
      proofed in `2`, and $\empty\ne B^{*'}_f \subseteq B^{'}_f$​ has
      been illustrated in `1`.

    - So,
      $b \in (B^{*'}_f \cap B_2)\subseteq \complement_{B^{'}_{f}}B_1$.

    - Since according to $\eqref{floor_conclusion}$, there is
      $0\le m=\sum_{i=1}^n b_i < n$. So,
      $\forall i \in \{1,2,\ldots,n\}~b_{i}\ge 0$, and there
      $\exists i_t\ne i_s$, that $b_{i_t}=0$.

    - Without loss of generality, let $i_s<i_t$.

    - Define $b^{'}=[b^{'}_{1},b^{'}_{2},\ldots,b^{'}_{n}]$, where
      $b^{'}_{i_s}=b_{i_s}-1,b^{'}_{i_t}=b_{i_t}+1, \forall i \in \{i|i \in [1,n], i\in \mathbb{Z}, i \notin \{i_s,i_t\}\}, b^{'}_i=b_i$.

    - Obviously,there are:

      - $b^{'}\in \complement_{B^{'}_{f}}B_1\subseteq B^{'}_f$,

      - $(I)\rightarrow$ and
        $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ge (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.

    - Also, according to helper functions and conclusions in [appendix
      A.x](#A.x), then: $$
      \begin{split}
      &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
      &=|b^{'}_{i_s}+x_{i_s}|^{p}+|b^{'}_{i_t}+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
      &=|b_{i_s}-1+x_{i_s}|^{p}+|b_{i_t}+1+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
      &=-(|b_{i_s}+x_{i_s}|^{p}-|b_{i_s}-1+x_{i_s}|^{p})+(|b_{i_t}+1+x_{i_t}|^{p}-|b_{i_t}+x_{i_t}|^{p})\\
      &=-I(b_{i_s},x_{i_s})+I(b_{i_t}+1,x_{i_t})\\
      &=-[I(b_{i_s},x_{i_s})-I(1,x_{i_t})]\\
      &<0.
      \end{split}
      $$

    - So,
      $\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}< \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}$​.

    - Therefore,
      $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} < (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$,
      which is contradictory to $(I)$, so the above assumption is not
      valid.

    - So, $B^{*'}_f\cap B_2 = \empty$, i.e.,
      $B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_2$.

    - Therefore,
      $B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2$.

    So, `3` is proofed.

4.  Let $$
    \begin{split}
    B_3=\{b|&b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m,\\
    &h\in \mathbb{Z}^+,h\ge2, \\
    &\exists s,t \in \{1,2,\ldots,h\}, s < t,i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t},b_{i_s}< b_{i_t}\}\subseteq B^{'}_{f},
    \end{split}
    $$ then there will be
    $B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$.

    Proof:

    - Since $B_3$​ is not a simple definition, we explain it first:

      - $h\in \mathbb{Z}^+$
      - If \$h, \$
        - $\exists s,t \in \{1,2,\ldots,h\}, s < t, i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t}$,
        - $\forall b \in B_3$, \$ b ^n,~\_{i=1}^n b_i = m\$, and
          $b_{i_s}< b_{i_t}$.
      - If $h=1$, $B_3 = \empty$​.

    - If \$h, \$

      - Obviously, $B_3 \ne \empty$.

        - Assume that there
          $\exists b=[b_1,b_2,\ldots,b_n]\in B^{*'}_f \cap B_3$​​​.

        - So, $\exists i_s \in G_s, i_t\in G_t$, that
          $b_{i_s}< b_{i_t}$.

        - And, there is $x_{i_s} < x_{i_t}$.

        - The
          $B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2$
          has been proofed in `2`, and
          $\empty\ne B^{*'}_f \subseteq B^{'}_f$ has been illustrated in
          `1`.

        - So,
          $b \in (B^{*'}_f \cap B_3)\subseteq \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2$​.

        - Since according to $\eqref{floor_conclusion}$, there is
          $0\le m=\sum_{i=1}^n b_i < n$, and according to
          $\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}$’s
          field, there is
          $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,1\}$.

        - So, $b_{i_s}=0, b_{i_t} = 1$.

        - Define $b^{'}=[b^{'}_{1},b^{'}_{2},\ldots,b^{'}_{n}]$, where
          $b^{'}_{i_s}=b_{i_s}+1,b^{'}_{i_t}=b_{i_t}-1, \forall i \in \{i|i \in [1,n], i\in \mathbb{Z}, i \notin \{i_s,i_t\}\}, b^{'}_i=b_i$.

        - Obviously,there are:

          - $b^{'}\in (\complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2) \subseteq B^{'}_f$,

          - $(I)\rightarrow$ and
            $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ge (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$​.

        - Also, according to helper functions and conclusions in
          [appendix A.x](#A.x), then: $$
          \begin{split}
          &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
          &=|b^{'}_{i_s}+x_{i_s}|^{p}+|b^{'}_{i_t}+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
          &=|b_{i_s}+1+x_{i_s}|^{p}+|b_{i_t}-1+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
          &=(|b_{i_s}+1+x_{i_s}|^{p}-|b_{i_s}+x_{i_s}|^{p})-(|b_{i_t}+x_{i_t}|^{p}-|b_{i_t}-1+x_{i_t}|^{p})\\
          &=I(b_{i_s}+1,x_{i_s})-I(b_{i_t},x_{i_t})\\
          &=I(1,x_{i_s})-I(1,x_{i_t})\\
          &< 0.
          \end{split}
          $$

        - So,
          $\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}< \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}$​.

        - Therefore,
          $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} < (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$,
          which is contradictory to $(I)$, so the above assumption is
          not valid.

        - So, $B^{*'}_f\cap B_3 = \empty$, i.e.,
          $B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_3$​.

    - If $h=1$, ,then $B_3 = \empty$, and there is till
      $B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_3$.

    Therefore,
    $B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$

    So, `4` is proofed.

5.  Since
    $\empty \ne B^{*'}_f \subseteq \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$,
    there is
    $B^{*'}_f = \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$.

    Proof:

    Since: $$
    \begin{split}
    B_1= \{b|&b\in \mathbb{Z}^n,\sum_{i=1}^n b_i = m, \exists i_s,i_t \in \{1,2,\ldots,n\},b_{i_s}\ge 1,b_{i_t}\le -1\}\subseteq B^{'}_f\\
    B_2= \{b|&b \in \mathbb{Z}^n,\sum_{i=1}^n b_i = m, \exists i_s \in \{1,2,\ldots,n\}, b_{i_s}\ge 2\}\subseteq B^{'}_f\\
    B_3=\{b|&b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m,\\
    &h\in \mathbb{Z}^+,h\ge2, \\
    &\exists s,t \in \{1,2,\ldots,h\}, s < t,i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t},b_{i_s}< b_{i_t}\}\subseteq B^{'}_{f}\\
    \end{split}
    $$ And according to $\eqref{floor_conclusion}$, there is
    $0\le m < n$​, so,
    $\forall b=[b_1,b_2,\ldots,b_n] \in \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$,
    there are:

    - $\sum_{i=1}^n b_i = m$

    - $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,1\}$​

    - $h\in \mathbb{Z}^+$

    - If \$h, \$

      - $\forall s,t \in \{1,2,\ldots,h\}, s < t, i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t}$,
        there is $b_{i_s} \ge b_{i_t}$

      - If $m = 0$,

        - then $\forall i \in \{1,2,\ldots,n\}~b_{i}=0$​, i.e.,
          $b=\theta$.
        - And the set \$ *{B^{‘}*{f}}B_1 *{B<sup>{’}*{f}}B_2
          *{B</sup>{’}*{f}}B_3 = {b=}\$​, which is a single element set.
        - so,
          $B^{*'}_f = \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$

      - If $m > 0$, there will be
        $\exist h^{'} \in \{1,2,\ldots,h\} \sum_{i=1}^{h^{'}-1}g_i \le m < \sum_{i=1}^{h^{'}}g_i$.

        - If \$\_{i=1}<sup>{h</sup>{’}-1}g_i = m \$,

          - then
            $\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=1$.
          - and,
            $\forall i \in G_{h^{'}} \cup G_{h^{'}+1} \cup \ldots \cup G_{h}, b_{i}=0$.
          - And the set \$ *{B^{‘}*{f}}B_1 *{B<sup>{’}*{f}}B_2
            *{B</sup>{’}*{f}}B_3 = {b}\$​​, which is a single element set.
          - So,
            $B^{*'}_f = \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$

        - If $\sum_{i=1}^{h^{'}-1}g_i < m < \sum_{i=1}^{h^{'}}g_i$​​,

          - then
            $\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=1$​​.

          - let $q = m-\sum_{i=1}^{h^{'}-1}g_i$:

            - Obviously, $1\le q < g_{h^{'}}$​.
            - Let
              $Q=\{\lambda^{q}|\lambda^{q}=(i_1,i_2,\ldots,i_q)\in G_{h^{'}}^q, \forall u,v \in \{1,2,\ldots,q\}, i_u\ne i_v\}$,
            - there is
              $\forall \lambda^q=(i_1,i_2,\ldots,i_q) \in Q, \Lambda=\{i_1,i_2,\ldots,i_q\} \subsetneq G_{h^{'}}$
            - $\forall i\in \{i_1,i_2,\ldots,i_q\}, b_i = 1$,
            - and
              $\forall i \in \complement_{G_{h^{'}}}^{\Lambda}, b_i = 0$

          - and,
            $\forall i \in G_{h^{'}+1} \cup G_{h^{'}+2} \cup \ldots \cup G_{h}, b_{i}=0$​​.

          - So, the set \$ *{B^{‘}*{f}}B_1 *{B<sup>{’}*{f}}B_2
            *{B</sup>{’}*{f}}B_3\$, is not a single element set. It has
            $C_{g_{h^{'}}}^{q}>1$ elements.

          - Assume
            $\exists b^{'}=[b^{'}_{1},b^{'}_{2},\ldots,b^{'}_{n}] \in \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3, b^{'}\ne b$​,
            that
            make$(I)\rightarrow (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ne (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$​.

            - So,
              $\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=b^{'}_{i}=1$​.
            - $\exists \empty \ne U=\{u_1,u_2,\ldots,u_{\sigma}\} \subseteq G_{h^{'}}$,
              $\empty \ne V=\{v_1,v_2,\ldots,v_{\sigma}\} \subseteq G_{h^{'}}$,$U\cap V = \empty, U\cup V \subseteq G_{h^{'}}$,
              - where $\forall i_u \in U, b_{i_u}=1,b^{'}_{i_u}=0$,
              - and $\forall i_v \in V, b_{i_v}=0,b^{'}_{i_v}=1$​.
              - Let $W = \complement_{G_{h^{'}}}^{U\cup V}$, then,
                $\forall i_w \in W, b_{i_w}=b^{'}_{i_w}$
              - Since $\forall i_u,i_v \in G_{h^{'}}, x_{i_u}=x_{i_v}$,
                let
                $\forall i_u,i_v \in G_{h^{'}}, x_{i_u}=x_{i_v}=\Omega$
            - $\forall i \in G_{h^{'}+1} \cup G_{h^{'}+2} \cup \ldots \cup G_{h}, b_{i}=b^{'}_{i}=0$.

          - Therefore: $$
            \begin{split}
            &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
            &\sum_{i=1}^n |x_i+b^{'}_i|^{p}- \sum_{i=1}^n |x_i+b_i|^{p}\\
            &=\sum_{i\in G_{h^{'}}} |x_i+b^{'}_i|^{p} - \sum_{i\in G_{h^{'}}} |x_i+b_i|^{p}\\
            &=\sum_{i\in U\cup V} |x_i+b^{'}_i|^{p} - \sum_{i\in U\cup V} |x_i+b_i|^{p}\\
            &=\sum_{i\in U} |x_i|^{p}+\sum_{i\in V} |x_i+1|^{p} - (\sum_{i\in U} |x_i+1|^{p}+\sum_{i\in V} |x_i|^{p})\\
            &=\sigma |\Omega|^{p}+\sigma|\Omega+1|^{p} - (\sigma|\Omega+1|^{p}+\sigma|\Omega|^{p})\\
            &=0
            \end{split}
            $$

          - so,
            $\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}= \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}$.

          - Therefore,
            $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} = (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$,
            which is contradictory to $(I)$​, so the above assumption is
            not valid.

          - So,
            $\forall b^{'} \in \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3, b^{'}\ne b$,
            there is
            $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} = (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.

          - so,
            $B^{*'}_f = \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$

    - If $h = 1$, then $B_3 = \empty$​, $G_1 = \{1,2,\ldots,n\}$

      - If $m = 0$,

        - then $\forall i \in \{1,2,\ldots,n\}~b_{i}=0$​, i.e.,
          $b=\theta$.
        - And the set \$ *{B^{‘}*{f}}B_1 *{B<sup>{’}*{f}}B_2
          *{B</sup>{’}*{f}}B_3 = {b=}\$​, which is a single element set.
        - so,
          $B^{*'}_f = \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$

      - If $m > 0$, there will be $0< m < n$​.

        - let $q = m$:

          - Obviously, $1\le q < n$​.
          - Let
            $Q=\{\lambda^{q}|\lambda^{q}=(i_1,i_2,\ldots,i_q)\in G_{1}^q, \forall u,v \in \{1,2,\ldots,q\}, i_u\ne i_v\}$,
            there is $\Lambda=\{i_1,i_2,\ldots,i_q\} \subsetneq G_{1}$
          - $\forall i\in \{i_1,i_2,\ldots,i_q\}, b_i = 1$,
          - and $\forall i \in \complement_{G_{1}}^{\Lambda}, b_i = 0$​.

        - So, the set \$ *{B^{‘}*{f}}B_1 *{B<sup>{’}*{f}}B_2
          *{B</sup>{’}*{f}}B_3\$, is not a single element set. It has
          $C_{g_{1}}^{q}=C^{m}_n>1$​ elements.

        - Assume
          $\exists b^{'}=[b^{'}_{1},b^{'}_{2},\ldots,b^{'}_{n}] \in \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3, b^{'}\ne b$​,
          that
          make$(II)\rightarrow (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ne (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$​.

        - So,$\exists \empty \ne U=\{u_1,u_2,\ldots,u_{\sigma}\} \subseteq G_{1}$,
          $\empty \ne V=\{v_1,v_2,\ldots,v_{\sigma}\} \subseteq G_{1}$,$U\cap V = \empty, U\cup V \subseteq G_{1}$,

          - where $\forall i_u \in U, b_{i_u}=1,b^{'}_{i_u}=0$,
          - and $\forall i_v \in V, b_{i_v}=0,b^{'}_{i_v}=1$​.
          - Let $W = \complement_{G_{1}}^{U\cup V}$, then,
            $\forall i_w \in W, b_{i_w}=b^{'}_{i_w}$
          - Since $\forall i_u,i_v \in G_{1}, x_{i_u}=x_{i_v}$, let
            $\forall i_u,i_v \in G_{1}, x_{i_u}=x_{i_v}=\Omega$

        - Therefore: $$
          \begin{split}
          &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
          &\sum_{i=1}^n |x_i+b^{'}_i|^{p}- \sum_{i=1}^n |x_i+b_i|^{p}\\
          &=\sum_{i\in G_{1}} |x_i+b^{'}_i|^{p} - \sum_{i\in G_{1}} |x_i+b_i|^{p}\\
          &=\sum_{i\in U\cup V} |x_i+b^{'}_i|^{p} - \sum_{i\in U\cup V} |x_i+b_i|^{p}\\
          &=\sum_{i\in U} |x_i|^{p}+\sum_{i\in V} |x_i+1|^{p} - (\sum_{i\in U} |x_i+1|^{p}+\sum_{i\in V} |x_i|^{p})\\
          &=\sigma |\Omega|^{p}+\sigma|\Omega+1|^{p} - (\sigma|\Omega+1|^{p}+\sigma|\Omega|^{p})\\
          &=0
          \end{split}
          $$

        - so,
          $\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}= \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}$.

        - Therefore,
          $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} = (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$,
          which is contradictory to $(II)$​, so the above assumption is
          not valid.

        - So,
          $\forall b^{'} \in \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3, b^{'}\ne b$,
          there is
          $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} = (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.

        - so,
          $B^{*'}_f = \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$​

    So, `5` is proofed.

6.  Since
    $B^{*'}_f = \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$,
    there is
    $B^{*}_f = \complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$​.

    Proof:

    - Since $$
      \begin{split}
       B_f=\{b|&b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m,\\&[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n\}\\
      B^{'}_f=\{b|&b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m\}.\\
      B^{*}_f=\{b|&b=\mathop{\arg\min}\limits_{b\in B_f}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}\\
      B^{*'}_f=\{b|&b=\mathop{\arg\min}\limits_{b\in B^{'}_f}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}
      \end{split}
      $$

    - And
      $B_f\subseteq B^{'}_f, \empty \ne B^{*}_f\subseteq B_f,~\empty\ne B^{*'}_f \subseteq B^{'}_f$​​
      has been illustrated in `1`.

    - According to $\eqref{floor_conclusion}$, there is $0\le m < n$,
      so,
      $\forall b=[b_1,b_2,\ldots,b_n] \in B^{*'}_f=\complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$,
      there are:

      - $\sum_{i=1}^n b_i = m$
      - $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,1\}$
      - so, there will always be
        $[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n$​
      - so, $b\in B_f$
      - according according to [lemma 2](#Lemma 2), there is
        $b\in B^{*}_f \subseteq B^{*'}_f$​.

    - So, there is also $B^{*'}_f \subseteq B^{*}_f$

    - So,
      $B^{*}_f = B^{*'}_f =\complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$

    So, `6` is proofed.

7.  Give out a
    $b \in B^{*}_f = B^{*'}_f =\complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$.

    - Since,
      $x=[x_1,x_2,\ldots,x_n], \forall i \in \{1,2,\ldots,n\},x_i = floor(r_iN)-r_iN$​​.

    - Let $\hat N = \{1,2,\ldots,n\}$,

    - and
      $Q=\{\lambda^{n}|\lambda^{n}=(i_1,i_2,\ldots,i_n)\in {\hat N}^n, \forall u,v \in \hat N, u\ne v, i_u\ne i_v,  \forall s,t \in \hat N,s<t, x_{i_s}\le x_{i_t}\}$,

    - So, there is
      $\forall \lambda^n=(i_1,i_2,\ldots,i_n) \in Q, \Lambda=\{i_1,i_2,\ldots,i_n\} = \hat N$,
      $x_{i_1}\le x_{i_2} \le \ldots \le x_{i_n}$​.

    - And according `1`, $\forall \lambda^n=(i_1,i_2,\ldots,i_n) \in Q$

    - $\exists h\in \mathbb{Z}^+, h\le n, g_1,g_2,\ldots, g_h \in \mathbb{Z}^+,\sum_{i=1}^{h}g_i=n$,
      that make

      - $G_1 = \{i_1,i_2,\ldots,i_{g_1}\} \subseteq \{1,2,\ldots,n\}, \forall i_s,i_t \in G_1, x_{i_s}=x_{i_t}$.
      - $G_2 = \{i_{g_1+1},i_{g_1+1},\ldots,i_{g_1+g_2}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_2, x_{i_s}=x_{i_t}$.
      - …
      - $G_h = \{i_{1+\sum_{i=1}^{h-1}g_i},i_{2+\sum_{i=1}^{h-1}g_i},\ldots,i_{\sum_{i=1}^{h}g_i}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_h, x_{i_s}=x_{i_t}$.
      - $G_1 \cup G_2 \cup \ldots \cup G_h = \{1,2,\ldots,n\}$
      - $\forall s,t \in \{1,2,\ldots,h\}$ and $s\ne t$, there is
        $G_s \cap G_t \ne \empty$
      - $\forall s,t \in \{1,2,\ldots,h\}, s<t$, there is
        $\forall i_s \in G_s, i_t \in G_t$, that $x_{i_s}<x_{i_t}$.
      - $\lambda^n=(i_1,i_2,\ldots,i_n)=(i_1,i_2,\ldots,i_{g_1},i_{g_1+1},i_{g_1+1},\ldots,i_{g_1+g_2},i_{1+\sum_{i=1}^{h-1}g_i},i_{2+\sum_{i=1}^{h-1}g_i},\ldots,i_{\sum_{i=1}^{h}g_i})$

    - $(I)\rightarrow$Consider a
      $b=[b_1,b_2,\ldots,b_n] \in \mathbb{Z}^n$ as:

      - Let $m=N-\sum_{i=1}^n floor(r_iN)$,
        - From the conclusion $\eqref{floor_conclusion}$, there are
          $m \in \mathbb{Z},0 \le m < n$.
      - where
        $\forall s \in \{s|s \in [1,m], s \in \mathbb{Z}^+\} b_{i_s} = 1, \forall t \in \{t|t \in [m+1,n], t \in \mathbb{Z}^+\} b_{i_t} = 0.$​

    - Obviously,

      - $b \in B^{'}_{f}$.
      - $b \in \complement_{B^{'}_{f}}B_1$, since
        $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,1\}$.
      - $b \in \complement_{B^{'}_{f}}B_2$, since
        $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,1\}$.​

    - If $h\ge2, h\in \mathbb{Z}^+$,

      - then
        $\forall s,t \in \{1,2,\ldots,h\}, s < t, i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t}$.
      - So, there is
        $x_{i_1}=x_{i_2},\ldots,x_{i_{g_1}}<x_{i_{g_1+1}}=x_{i_{g_1+1}}=\ldots=x_{i_{g_1+g_2}}<x_{i_{1+\sum_{i=1}^{h-1}g_i}}=x_{i_{2+\sum_{i=1}^{h-1}g_i}}=\ldots=x_{i_{\sum_{i=1}^{h}g_i}}$
      - and because
        $\forall s \in \{s|s \in [1,m], s \in \mathbb{Z}^+\} b_{i_s} = 1, \forall t \in \{t|t \in [m+1,n], t \in \mathbb{Z}^+\} b_{i_t} = 0$,
      - therefore,
        $\forall s,t \in \{1,2,\ldots,h\}, s < t, i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t}$
        there is $b_{i_s} \ge b_{i_t}$,
      - so, $b \in \complement_{B^{'}_{f}}B_3$.

    - If $h=1$, then $B_3 = \empty$, there is
      $b \in \complement_{B^{'}_{f}}B_3$

    - So, the $b$ of $(I)$ satisfices
      $b \in B^{*}_f = B^{*'}_f =\complement_{B^{'}_{f}}B_1 \cap \complement_{B^{'}_{f}}B_2 \cap \complement_{B^{'}_{f}}B_3$

Along the above 7 points, the
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

[^1]: 《IEEE 754》, . 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rule

[^2]: 《IEEE 754》, . 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rule

[^3]: 《IEEE 754》, . 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rule

[^4]: 《IEEE 754》, . 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rule

[^5]: 《IEEE 754》, . 2024年4月20日. 见于: 2024年4月26日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=IEEE_754&oldid=1219817053#Rounding_rule

[^6]: (2022, November 17). Built-in Functions — Python 3.11.0 documentation. Docs. https://docs.python.org/3/library/functions.html?highlight=sorted#sorted

[^7]: (2022, November 17). Sorting algorithm - Wikipedia. En. https://en.wikipedia.org/wiki/Sorting_algorithm#Stability
