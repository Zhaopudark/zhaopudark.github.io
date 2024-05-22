---
abbrlink: 70807cc5
categories: Topics
date: "2023-10-25 16:22:37"
math: true
mathjax: true
tags:
- Mathematics
- Machine Learning
- Algorithm
- Python
title: Discuss the mathematics of apportionment when splitting the
  machine learning dataset into several parts by proportions
updated: "2024-05-23 01:06:11"
---

This article discusses an operation that originated in machine learning,
i.e., when splitting a dataset with the same genre of elements by a
series of proportions, how to determine the element’s total number of
each divided group, focusing on dealing with decimal rounding problems.

Initially, this operation was not a theoretical problem, but a simple
engineering problem for programming implementation. However, we
performed further thoughts and analysis, refined this operation into a
[mathematics apportionment
problem](https://en.wikipedia.org/w/index.php?title=Mathematics_of_apportionment),
defined the objective, and then gave out the solution with algorithm
implementation. This article records these processes.

<!-- more -->

# Introduction

> **Mathematics of apportionment** describes
> [mathematical](https://en.wikipedia.org/wiki/Mathematics) principles
> and algorithms for fair allocation of identical items among parties
> with different entitlements. [^1]

The [mathematics of
apportionment](https://en.wikipedia.org/wiki/Mathematics_of_apportionment)
in machine learning usually occurs when splitting a dataset of the same
genre of elements into `train set`, `validate set`, and `test set`,
according to a series of proportions, such as `[0.7,0.1,0.2]`,
`[0.8,0.1,0.1]` and so on. When conducting, we consider all data to be
identical, and determine the divided quantity of each subset. So, it
will be a method of [rounding](https://en.wikipedia.org/wiki/Rounding)
fractions to integers[^2], which may lead to some problems:

- **How to rounding, i.e., how to handle decimals?**

  Let’s look at an example, i.e., how to divide a dataset consisting of
  $248$ elements into `train set`, `validate set`, and `test set`,
  according to proportions $[0.7,0.1,0.2]$?

  Simply multiplying the total number of elements by the ratio: $$
  \begin{split}
  &\text{train set}: &248\times0.7=173.6\\
  &\text{validate set}: &248\times0.1=24.8\\
  &\text{test set}: &248\times0.2=49.6
  \end{split}
  $$ There are at least the following options and their dilemmas:

  - `Solution 1`: `train set` gets $173$, `validate set` gets $24$,
    `test set` gets $49$
    - But $173+24+49=246<248$, 2 elements will be dropped. Which 2
      elements will be chosen to be dropped? Why choose them but not
      other else?
  - `Solution 2`: `train set` gets $174$, `validate set` gets $25$,
    `test set` gets $50$
    - But $174+25+50=249>248$ , lacking 1 element. Where to find an
      extra element? We should not make any overlap on these 3 sets.
  - `Solution 3`, basing on the first option and manually divide more
    elements to `train set` and `test set`: `train set` gets $174$,
    `validate set` gets $24$, `test set` gets $45$
    - It seems good because of $174+24+50=248\equiv 248$. But, why not
      divide more elements to `validate set`? And, can this result still
      be considered as the one according to ratios $0.7,0.1,0.2$ without
      any disputation?

- **How to maintain the fairness?**

  As the above example, how to divide a dataset consisting of $247$
  elements into `train set`, `validate set`,and `test set`, according to
  proportions $[0.8,0.1,0.1]$?

  Simply multiplying the total number of elements by the ratio: $$
  \begin{split}
  &\text{train set}: &247\times0.8=197.6\\
  &\text{validate set}: &248\times0.1=24.8\\
  &\text{test set}: &248\times0.1=24.8
  \end{split}
  $$

  - `Solution 1`: `train set` get $198$, `validate set` get $25$,
    `test set` get $24$.
  - `Solution 2`: `train set` get $198$, `validate set` get $24$,
    `test set` get $25$.

  Both `Solution 1` and `Solution 2` are equally reasonable solutions,
  and there is no mathematical way to choose one over the other.[^3]

## Common Practice

We have found the followings on [Stack
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

In these solutions, the program is concerned more about its’
implementation, instead of the rationality of the result, when
encountering decimals. In addition, the
“[sklearn.model_selection.train_test_split](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.train_test_split.html)”
is widely used in these solutions to realize dataset partition. Is it
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

- **No certainty/determinism** about the division ratio: The division
  result after swapping 2 different splitting proportions is different
  from that of swapping the corresponding original division result.
- **Lack of consideration** on the significance of the generated
  decimal: It uses simple rounding and completes the missing elements at
  the end of the division interval.

{% endnote %}

## Motivation and Objectives

As the above introduction, we can get the following points:

- Divide/partition/split a dataset of the same genre of elements by a
  series of proportions will lead to decimal problems and fairness
  problems.
- The current common practice does not pay much attention to these
  problems.

Therefore, in this article, we will do the following steps:

1.  Give out a feasible standard to indicate a rounding method/target to
    **deal with the decimal problem**.
2.  According to the defined standard, give out objectives and
    requirements from the perspective of [mathematics
    apportionment](https://en.wikipedia.org/wiki/Mathematics_of_apportionment).
3.  Give out the solution set to **circumvent the fairness problem**.
    That is, if we give out all of the solutions, we need not choose one
    over the other mathematically by some measuring function. When
    practice, some external priority rules can be used to finally choose
    a solution. But that would be beyond the scope of this article.
4.  Design the corresponding algorithms.

### Partition Standard

To deal with decimal problems when splitting a dataset of the same genre
of elements into parts by proportions, we give out the following
partition standard:

- **Non-omission**: Do not drop any element, as
  `sklearn.model_selection.train_test_split` does. It is difficult to
  find a reason to drop a particular element in a dataset. Why discard a
  certain element but not drop others else? It would be reckless to
  discard elements at will just because of the decimal problem (integer
  division problem). And, if some elements have been dropped, the
  dataset will be a subset of the original one from the beginning, which
  will incur further problems in the theory section, particularly in the
  circumstance of small-size datasets. So, the best way is not to miss
  any element.

- **Non-overlapping**: Do not make any 2 divided partitions overlap.
  Overlapping, i.e., the same element appearing in 2 partitions
  simultaneously, can directly lead to a bad division that is unable to
  be used. For example, in machine learning, the overlapping between
  `train set` and `test set` is a serious and principled error that
  should not be allowed to occur.

- **Determinacy(Reproducibility)**: For a determined ratio, the
  partition result should be deterministic. So, anyone can reproduce the
  result if the element’s total number and proportions are known. And,
  the swapping on division ratios will be reflected on corresponding
  divided parts simultaneously, unless there are 2 identical division
  ratios.

  {% note info %}

  The 2 identical dividing proportions may bring about **fairness
  problem**. This will be circumvented by giving out the solution set,
  as the aforesaid parts.

  {% endnote %}

- **Precision**: Make the division result closest to the one that the
  given ratios expect. Multiply the total number with proportions as the
  desired division result, which can be considered as a vector, although
  its value may not be integers. Consider the actual result also a
  vector, which must be integers as a result. We want to make the
  `p-norm` ($p>1$) distance (considered as a division metric/error)
  between the desired vector and the actual vector obtain a minimum
  value.

  {% note info %}

  Generally, the `p-norm` ($p=2$) distance is the most common metric for
  measuring the distance between vectors. In the original research for
  this article, we have found that all `p-norms` ($p\ge 1$) can lead to
  a certain solution with deterministic. And, we have found:

  - The `p-norm` ($p=1$) is only able to derive weak conclusions.
    - It will lead to the expansion of the solution set, and the
      complete solution set cannot be easily obtained, but only its
      subset can be determined.
  - The `p-norm` ($p>1$) can derive strong conclusions.
    - The complete solution set can be easily obtained.
  - So, we prefer to use `p-norm` ($p>1$).

  {% endnote %}

### Objectives and Requirements

According to the defined standard, give out objectives and requirements
described in mathematical terms:

- Given a set $S$ of $N$ identical elements, i.e.,
  $S=\{s_1,s_2,\ldots,s_N\}$, where $N\in \mathbb{Z}^+$.
- Given a list of proportions $r$, where
  $r=[r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1,n\in \mathbb{Z}^+, n \le N$.
- Try to divide $S$ into $n$ parts by $r$.
- Define result vector $y=[y_1,y_2,\ldots,y_n]\in \mathbb{N}^n$, where
  $y_i$ represents the element numbers in the $i$-th divided parts.
- Let
  $D_y = \{y|y=[y_1,y_2,\ldots,y_n]\in \mathbb{N}^n,\sum_{i=1}^{n}y_i=\|y\|_1=N\}$
- Define an objective function
  $f(y):D_y\rightarrow \mathbb{R}^+\cup\{0\}$ as:
  - Given a $p, p\in \mathbb{R}, p> 1$.
  - $\forall y \in D_y, f(y)=(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}$.
- Try to find a the
  $D^*_y=\{y|y=\mathop{\arg\min}\limits_{y\in D_y}f(y)\}$.
- $\forall y^*=[y^*_1,y^*_2,\ldots,y^*_n]$, divide $S$ into `n` parts:
  - part `1`: $\{s_1,s_2,\ldots,s_{y^{*}_1}\}$
  - part `2`:
    $\{s_{y^{*}_1+1},s_{y^{*}_1+2},\ldots,s_{y^{*}_1+y^{*}_2}\}$
  - …
  - part `n`:
    $\{s_{\sum_{i=1}^{n-1}y^*_i+1},s_{\sum_{i=1}^{n-1}y^*_i+2},\ldots,s_{\sum_{i=1}^{n}y^*_i}\}$

{% note info %}

- The constraint $n\le N$ is needed to exclude many unrealistic
  scenarios. Because if $n>N$, there must be at least one divided part
  that possesses no element, instead of being determined by the
  corresponding ratio $r_i$.
- The constraint of the set $D_y$ can guarantee **non-omission** and
  **non-overlapping**.
- The objective function $f(y)$ can guarantee
  **determinacy(reproducibility)** and **precision**.

{% endnote %}

So, the key objective is equivalent to solve a Nonlinear Integer
Programming (NIP) problem: $$
\begin{equation}\label{NIP_problem}\tag{1}
\begin{split}
\text{known:}~~~~&n,N \in \mathbb{Z}^+, n \le N\\
&p\in \mathbb{R},~p> 1\\
&r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\\
\text{minimize:}~~~~&(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}\\
\text{subject to:}~~~~&~y = [y_1,y_2,\ldots,y_n]\in \mathbb{N}^n\\
&\sum_{i=1}^{n}y_i=N\\
\end{split}
\end{equation}
$$ In this article, we will analyze the NIP problem
$\eqref{NIP_problem}$, give out the set of solutions, and post an
algorithm to get the set of solutions. The necessary proofs and
explanations will also be illustrated.

## Concept Extension

There are some related concepts:

- Approximating each of a finite set of real numbers by an integer so
  that the sum of the rounded numbers equals the rounded sum of the
  numbers. See
  [rounding](https://en.wikipedia.org/w/index.php?title=Rounding).

- [Party-list proportional
  representation](https://en.wikipedia.org/wiki/Party-list_proportional_representation)

- [Largest remainders
  method](https://en.wikipedia.org/wiki/Largest_remainders_method)

- [Highest averages
  method](https://en.wikipedia.org/wiki/Highest_averages_method)

- [Apportionment
  (politics)](https://en.wikipedia.org/wiki/Apportionment_(politics))

- [Mathematics of
  apportionment](https://en.wikipedia.org/wiki/Mathematics_of_apportionment)

- [Integer
  programming](https://en.wikipedia.org/wiki/Integer_programming)

- [Stratified
  sampling](https://en.wikipedia.org/wiki/Stratified_sampling)

  {% note info %}

  Partitioning datasets by proportions is a sub-operation when doing
  stratified sampling for all genres of samples. Therefore, in this
  article, we only discuss this low-level sub-operation and do not
  discuss higher-level operations such as stratified sampling. That is,
  this article always regards the operated dataset’s elements are all in
  the same genre.

  {% endnote %}

# Basic analyses

Generally, the enumeration method of problem $\eqref{NIP_problem}$ is to
traverse a number of $\binom{N+n-1}{n-1}$ vector
$y\in D_y = \{y|y=[y_1,y_2,\ldots,y_n]\in \mathbb{N}^n,\sum_{i=1}^{n}y_i=\|y\|_1=N\}$
to find the solution, see [appendix A.1](#A.1). If for each $y$, it
takes $O(n)$ to calculate the objective function, the time complexity of
this enumeration method will be about
$O(\binom{N+n-1}{n-1}\times n)=O(\frac{(N+n-1)!}{(n-1)!N!}\times n)$.

So, without any optimization, the problem $\eqref{NIP_problem}$ is
almost difficult to calculate and solve.

Therefore, to sove the problem $\eqref{NIP_problem}$, we can take the
following ideas:

1.  Define
    $D_{r,n,N}=\{(r,n,N)| n\in \mathbb{Z}^+,N \in \mathbb{Z}^+, n \le N, r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.

2.  $\forall n \in \mathbb{Z}^+$, define
    $D_{r,N}=\{(r,N)|N \in \mathbb{Z}^+, N\ge n,r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}$.

3.  Choose a rounding function $round(\cdot)$ and try
    $y=[y_1,y_2,\ldots,y_n], \forall i \in \{1,2,\ldots,n\} y_i=round(r_iN)$,
    to estimate a solution $y$.

    - According to
      [rounding](https://en.wikipedia.org/w/index.php?title=Rounding)
      and [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754), there are
      many different **rounding rules**, deriving different
      $round(\cdot)$ functions, among which the rounding behaviors are
      slightly different. Here we choose
      $round(\cdot)=floor(\cdot)=\lfloor \cdot \rfloor$ as the
      $\forall x \in \mathbb{R},round_5(x)=floor(x)=\lfloor x\rfloor$ in
      [analyses of round
      function](https://little-train.com/posts/34195fcb.html).
    - So, the estimate $y=[floor(r_1N),floor(r_2N),\ldots,floor(r_nN)]$
    - The later sections will explain why other forms of rounding
      functions are not used.

4.  $\forall n \in \mathbb{Z}^+$, $\forall (r,N) \in D_{r,N}$, it is
    obviously that
    $y=[floor(r_1N),floor(r_2N),\ldots,floor(r_nN)] \in \mathbb{N}^n$.

5.  $\forall n \in \mathbb{Z}^+$, there $\exists (r,N) \in D_{r,N}$,
    that make $\sum_{i=1}^{n}floor(r_iN)=N$. As the following domain and
    range analyses:

    - Firstly, since the $r_iN$ is non-negative, we can give out a
      mathematical abstraction about $round(\cdot)$ function on
      $\mathbb{R}^+\cup \{0\}$ as: $$
      \begin{equation}\label{floor}\tag{2}
      \forall x \in \mathbb{R}^+\cup \{0\},round(x)=floor(x)=\lfloor x\rfloor
      \end{equation}
      $$

    - Then, we can define and focus on a mapping function
      $f(r,n,N):\{\mathbb{R}^n,\mathbb{Z}^+,\mathbb{Z}^+\}\rightarrow\{\mathbb{Z}\}$,
      $$
      \begin{equation}\label{floor_f}\tag{3}
      \forall (r,n,N) \in D_{r,n,N},f(r,n,N)=[\sum_{i=1}^n floor(r_{i}N)]-N
      \end{equation}
      $$

    - $\forall n \in \mathbb{Z}^+$, define the function $f(r,n,N)$’s
      value range set $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}$.

    - There is
      $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}=\{x|x \in (-n,0],x\in \mathbb{Z}\}$.
      See [the appendix A.4 of
      `analyses of round function`](https://little-train.com/posts/34195fcb.html#1533739c896a1d55a2625caced54a83fb05b374dbb66122f475751be01f44fb5-1)
      for analysis process.

    - Also from [the appendix A.4 of
      `analyses of round function`](https://little-train.com/posts/34195fcb.html#1533739c896a1d55a2625caced54a83fb05b374dbb66122f475751be01f44fb5-1),
      we can find a conclusion about the function $\eqref{floor_f}$
      that: $$
      \begin{equation}\label{floor_conclusion}\tag{4}
      \begin{split}
       \forall & n \in \mathbb{Z}^+,\\
       &\text{Define :} D_{r,N}=\{(r,N)|N\ge n, r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\}\\
       &\text{ there are:}\\
       &~~(I)~\forall (r,N) \in D_{r,N}, \forall i \in \{i|i\in [1,n],i \in \mathbb{Z}\},  -1 < floor(r_iN)-r_iN \le 0,\\
       &~~(II)~\forall (r,N) \in D_{r,N},-n < [\sum_{i=1}^n floor(r_{i}N)]-N \le 0.\\
       &~~(III)~\{x|x\in(-n,0],x\in Z\} \subseteq \{[\sum_{i=1}^n floor(r_{i}N)]-N| (r,N) \in D_{r,N}\}\\
       &~~(IV)\text{ especially}, 0\in \{[\sum_{i=1}^n floor(r_{i}N)]-N| (r,N) \in D_{r,N}\} \\
       &~~(V)\exists (r,N)\in D_{r,N},\sum_{i=1}^{n}floor(r_{i}N)=N
       \end{split}
      \end{equation}
      $$

6.  According to `4` and `5`, $\forall n \in \mathbb{Z}^+$, there
    $\exists (r,N) \in D_{r,N}$, that make
    $y=[floor(r_1N),floor(r_2N),\ldots,floor(r_nN)] \in D_y$.

7.  Furthermore, $\forall n \in \mathbb{Z}^+$,
    $\forall (r,N) \in D_{r,N}$:

    - If $y=[floor(r_1N),floor(r_2N),\ldots,floor(r_nN)] \notin D_y$, we
      can find a vector $b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n$ for $y$
      to constitute
      $[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n] \in D_y$.
    - If $y=[floor(r_1N),floor(r_2N),\ldots,floor(r_nN)] \in D_y$, we
      can find a vector $b=[b_1,b_2,\ldots,b_n]=\theta\in \mathbb{Z}^n$
      for $y$ to constitute
      $[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n] \in D_y$.

8.  So, the original NIP problem $\eqref{NIP_problem}$ can be equivalent
    to the following problem: $$
    \begin{equation}\label{NIP_problem_floor}\tag{5}
    \begin{split}
     \text{known:}~~~~&n,N \in \mathbb{Z}^+, n \le N\\
     &p\in \mathbb{R},~p> 1\\
     &r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1\\
     &m=N-\sum_{i=1}^n floor(r_iN)\\
     \text{minimize:}~~~~&(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\\
     \text{subject to:}~~~~&b = [b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n\\
     &[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n\\
     &\sum_{i=1}^n b_i=m\\
     \end{split}
    \end{equation}
    $$

9.  Basing on the problem $\eqref{NIP_problem_floor}$, what we need is
    to traverse all of the vector $b\in D_b$ to find the solution, where
    $$
    \begin{split}
     D_b = \{b|&b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\\
     &[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in\mathbb{N}^n,\\
     &m=N-\sum_{i=1}^n floor(r_iN)\\
     &\sum_{i=1}^n b_i=m\}
     \end{split}
    $$

10. The later sections will post the method to solve the problem
    $\eqref{NIP_problem_floor}$ instead of the direct NIP problem
    $\eqref{NIP_problem}$.

    {% note info %}

    Of course, the significance of the equivalent conversion from
    $\eqref{NIP_problem}$ to $\eqref{NIP_problem_floor}$ may be not
    reflected mathematically. The underlying logic is based on our
    intuition, i.e., we believe that fine-tuning based on an estimated
    solution ($y=[floor(r_1N),floor(r_2N),\ldots,floor(r_nN)]$) may lead
    to finding the true solution faster.

    {% endnote %}

# Method

See the `1~6` of [appendix A.3](#A.3), we can found the solution set of
problem $\eqref{NIP_problem_floor}$ as:

- Define
  $x=[x_1,x_2,\ldots,x_n], \forall i \in \{1,2,\ldots,n\},x_i = floor(r_iN)-r_iN$.

- Let $m=N-\sum_{i=1}^n floor(r_iN)$.

- Group $\{x_1,x_2,\ldots,x_n\}$ according their values as:

  - $\exists h\in \mathbb{Z}^+, h\le n, g_1,g_2,\ldots, g_h \in \mathbb{Z}^+,\sum_{i=1}^{h}g_i=n$,
    that make
    - $G_1 = \{i_1,i_2,\ldots,i_{g_1}\} \subseteq \{1,2,\ldots,n\}, \forall i_s,i_t \in G_1, x_{i_s}=x_{i_t}$.
    - $G_2 = \{i_{g_1+1},i_{g_1+1},\ldots,i_{g_1+g_2}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_2, x_{i_s}=x_{i_t}$.
    - …
    - $G_h = \{i_{1+\sum_{i=1}^{h-1}g_i},i_{2+\sum_{i=1}^{h-1}g_i},\ldots,i_{\sum_{i=1}^{h}g_i}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_h, x_{i_s}=x_{i_t}$.
    - $G_1 \cup G_2 \cup \ldots \cup G_h = \{1,2,\ldots,n\}$
    - $\forall s,t \in \{1,2,\ldots,h\}$ and $s\ne t$, there is
      $G_s \cap G_t \ne \emptyset$
    - $\forall s,t \in \{1,2,\ldots,h\}, s<t$, there is
      $\forall i_s \in G_s, i_t \in G_t$, that $x_{i_s}<x_{i_t}$.
    - Specially, if $h=1$, there will be
      $\forall i_s,i_t \in \{1,2,\ldots,n\}, x_{i_s}=x_{i_t}$

- Define $$
  \begin{split}
  D_b = \{b|&b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\\
  &[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in\mathbb{N}^n,\\
  &\sum_{i=1}^n b_i=m\}
  \end{split}
  $$

- Define
  $D^{'}_b=\{b|b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,m=N-\sum_{i=1}^n floor(r_iN),\sum_{i=1}^n b_i=m\}$.

- Define solutions set of problem $\eqref{NIP_problem_floor}$ as
  $D^{*}_b=\{b|b=\mathop{\arg\min}\limits_{b\in D_b}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}$.

- Define solutions set
  $D^{*'}_b=\{b|b=\mathop{\arg\min}\limits_{b\in D^{'}_b}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}$.

- Define
  $B_1= \{b|b\in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m, \exists i_s,i_t \in \{1,2,\ldots,n\}~b_{i_s}\ge 1,b_{i_t}\le -1\}\subseteq D^{'}_b$.

- Define
  $B_2= \{b|b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m,\exists i_s \in \{1,2,\ldots,n\}~b_{i_s}\ge 2\}\subseteq D^{'}_b$.

- Define $$
  \begin{split}
  B_3=\{b|&b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m,\\
  &h\in \mathbb{Z}^+,h\ge2, \\
  &\exists s,t \in \{1,2,\ldots,h\}, s < t,i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t},b_{i_s}< b_{i_t}\}\subseteq D^{'}_b,
  \end{split}
  $$

- So, the solutions set of problem $\eqref{NIP_problem_floor}$ is
  $D^{*}_b =\complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$

Back to the original problem $\eqref{NIP_problem}$, the solution set of
problem $\eqref{NIP_problem}$ is $$
\begin{split}
D^*_y=\{y|&y=[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n],\\
&\forall b=[b_1,b_2,\ldots,b_n]\in D^{*}_b\}
\end{split}
$$

## Why other forms of rounding functions are not used

- Actually, to estimate
  $y=[y_1,y_2,\ldots,y_n], \forall i \in \{1,2,\ldots,n\} y_i=round(r_iN)$,
  we can choose the $round(\cdot)$ function as:
  - $\forall x \in \mathbb{R},round_1(x)=\begin{cases}\lfloor x\rfloor,\text{if }x-\lfloor x\rfloor<0.5 \\\lfloor x\rfloor,\text{if }x-\lfloor x\rfloor=0.5,\lfloor x\rfloor \mod 2=0\\\lceil x\rceil,\text{if }x-\lfloor x\rfloor=0.5,\lceil x\rceil\mod 2= 0\\\lceil x\rceil,\text{if }x-\lfloor x\rfloor>0.5\end{cases}$
    in [analyses of round
    function](https://little-train.com/posts/34195fcb.html),
  - or,
    $\forall x \in \mathbb{R},~round_2(x)=\begin{cases}\lfloor x\rfloor,\text{if }x-\lfloor x\rfloor<0.5 \\\lceil x\rceil,\text{if }x-\lfloor x\rfloor=0.5,x > 0\\\lfloor x\rfloor,\text{if }x-\lfloor x\rfloor=0.5,x<0\\\lceil x\rceil,\text{if }x-\lfloor x\rfloor>0.5\end{cases}$
    in [analyses of round
    function](https://little-train.com/posts/34195fcb.html),
  - or $\forall x \in \mathbb{R},round_4(x)=ceil(x)=\lceil x\rceil$ in
    [analyses of round
    function](https://little-train.com/posts/34195fcb.html),
  - or $\forall x \in \mathbb{R},round_5(x)=floor(x)=\lfloor x\rfloor$
    in [analyses of round
    function](https://little-train.com/posts/34195fcb.html).
- First, in different programming languages, the default rounding
  function may be one of $round_1(x)$ and $round_2(x)$. But the slightly
  different behavior between $round_1(x)$ and $round_2(x)$ may lead our
  algorithm to behave inconsistently in different programming languages.
  So, we prefer not to use $round_1(x)$ and $round_2(x)$.
- Second, consider the range $F_n=\{f(r,n,N)|(r,N)\in D_{r,N}\}$, if we
  use $round_1(x)$ to replace the $round_5(x)$ that we have used, the
  range will become
  $\{x|x \in [-\frac{n}{2},\frac{n}{2}],x\in \mathbb{Z}\}$, whose left
  and right are both closed. This will bring the following consequences:
  - The helper function $H(k,x):\{\mathbb{Z},D\}\rightarrow \mathbb{R}$,
    that defined in [appendix A.2](#A.2), will lose its **special
    monotonicity property** of $k$.
  - As the steps in the `1~6` of [appendix A.3](#A.3), our conclusion
    will be weakened to
    $D^{*}_b \subseteq \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$.
  - We cannot give out an algorithm to find the whole solution set, but
    only an algorithm to find 1 of the solutions.
- Third, the $round_4(x)=ceil(x)$ is symmetric to $round_5(x)=floor(x)$,
  and $floor(x)$ reflects an idea of allocating first and then making up
  the difference, in line with general intuition. So, we prefer to use
  $round_5(x)$.
- So, we only use to $round_5(\cdot)$ estimate
  $y=[y_1,y_2,\ldots,y_n], \forall i \in \{1,2,\ldots,n\} y_i=round(r_iN)$.

## The Algorithm to Find the Whole Solution Set

According to the above solution set $D^{*}_b$ of problem
$\eqref{NIP_problem_floor}$ and the solution set $D^*_y$ of problem
$\eqref{NIP_problem}$, we can have the following algorithm for problem
$\eqref{NIP_problem}$:

1.  To find all
    $b \in D^{*}_b =\complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$.

    - Calculate
      $x=[x_1,x_2,\ldots,x_n],\forall i \in \{1,2,\ldots,n\},x_i = floor(r_iN)-r_iN$.
    - Calculate $m=N-\sum_{i=1}^n floor(r_iN)$,  
    - From the conclusion $\eqref{floor_conclusion}$, there are
      $m \in \mathbb{Z},0 \le m < n$.
    - Group $\{x_1,x_2,\ldots,x_n\}$ according their values as:
      - $\exists h\in \mathbb{Z}^+, h\le n, g_1,g_2,\ldots, g_h \in \mathbb{Z}^+,\sum_{i=1}^{h}g_i=n$,
        that make
      - $G_1 = \{i_1,i_2,\ldots,i_{g_1}\} \subseteq \{1,2,\ldots,n\}, \forall i_s,i_t \in G_1, x_{i_s}=x_{i_t}$.
      - $G_2 = \{i_{g_1+1},i_{g_1+1},\ldots,i_{g_1+g_2}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_2, x_{i_s}=x_{i_t}$.
      - …
      - $G_h = \{i_{1+\sum_{i=1}^{h-1}g_i},i_{2+\sum_{i=1}^{h-1}g_i},\ldots,i_{\sum_{i=1}^{h}g_i}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_h, x_{i_s}=x_{i_t}$.
      - $G_1 \cup G_2 \cup \ldots \cup G_h = \{1,2,\ldots,n\}$
      - $\forall s,t \in \{1,2,\ldots,h\}$ and $s\ne t$, there is
        $G_s \cap G_t \ne \emptyset$
      - $\forall s,t \in \{1,2,\ldots,h\}, s<t$, there is
        $\forall i_s \in G_s, i_t \in G_t$, that $x_{i_s}<x_{i_t}$.
    - According to the `7` of [appendix A.3](#A.3),
      - If \$h, \$ $m = 0$, $D^{*}_b=\{\theta\}$, which is a single
        element set.
      - If \$h, \$ $m > 0$,
        - If \$\_{i=1}<sup>{h</sup>{’}-1}g_i = m \$,
          - So $$
            \begin{split}
            D^{*}_b = \{b|&b = [b_1,b_2,\ldots,b_n]\\
            &\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=1,\\
            &\forall i \in G_{h^{'}} \cup G_{h^{'}+1} \cup \ldots \cup G_{h}, b_{i}=0\}
            \end{split}
            $$
          - The $D^{*}_b$ is a single element set.
        - If $\sum_{i=1}^{h^{'}-1}g_i < m < \sum_{i=1}^{h^{'}}g_i$,
          - So  
            $$
            \begin{split}
             D^{*}_b = \{b|&b = [b_1,b_2,\ldots,b_n],\\
             &\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=1,\\
             &q = m-\sum_{i=1}^{h^{'}-1}g_i,\\
             &Q=\{\lambda^{q}|\lambda^{q}=(i_1,i_2,\ldots,i_q)\in G_{h^{'}}^q, \forall u,v \in \{1,2,\ldots,q\}, i_u\ne i_v\}\\
             &\forall \lambda^q=(i_1,i_2,\ldots,i_q) \in Q, \Lambda=\{i_1,i_2,\ldots,i_q\} \subsetneq G_{h^{'}},\\
             &~~~~\forall i\in \{i_1,i_2,\ldots,i_q\}, b_i = 1,\\
             &~~~~\forall i \in \complement_{G_{h^{'}}}^{\Lambda}, b_i = 0\\
             &\forall i \in G_{h^{'}+1} \cup G_{h^{'}+2} \cup \ldots \cup G_{h}, b_{i}=0\}
             \end{split}
            $$
          - The $D^{*}_b$ has $\binom{g_{h^{'}}}{q}>1$ elements.
      - If $h = 1$, $m = 0$, $D^{*}_b=\{\theta\}$, which is a single
        element set.
      - If $h = 1$, $m > 0$,
        - So $$
          \begin{split}
          D^{*}_b = \{b|&b = [b_1,b_2,\ldots,b_n],\\
          &q = m,\\
          &Q=\{\lambda^{q}|\lambda^{q}=(i_1,i_2,\ldots,i_q)\in G_{1}^q, \forall u,v \in \{1,2,\ldots,q\}, i_u\ne i_v\}\\
          &\forall \lambda^q=(i_1,i_2,\ldots,i_q) \in Q, \Lambda=\{i_1,i_2,\ldots,i_q\} \subsetneq G_{1},\\
          &~~~~\forall i\in \{i_1,i_2,\ldots,i_q\}, b_i = 1,\\
          &~~~~\forall i \in \complement_{G_{1}}^{\Lambda}, b_i = 0\}
          \end{split}
          $$
        - The $D^{*}_b$ has $\binom{g_{1}}{q}=\binom{n}{m}>1$ elements.

2.  According all the found $b\in D^{*}_b$ in `1`, calculate all the
    $y\in D^*_y=\{y|y=[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n],\\ \forall b=[b_1,b_2,\ldots,b_n]\in D^{*}_b\}$.

3.  Generally, this algorithm’s worst-case time complexity is 1 order of
    magnitude greater than $O(n^2)$, because:

    - Grouping $\{x_1,x_2,\ldots,x_n\}$ according their values may take
      $O(n^2)$ generally.
    - For each $\{x_1,x_2,\ldots,x_n\}$, traverse $D^{*}_b$ will also
      take time.

## The Algorithm to Get 1 Solution of the Solution Set

Even though the above has given out an algorithm to find all of the
solutions, it takes a complexity more than $O(n^2)$. When practice, if
we do not care about the whole solution set, but only want to know a
valid one, we can take the following algorithm to get 1 solution of the
solution set, where the time complexity will be controlled within
$O(n^2)$.

According to the above solution set $D^{*}_b$ of problem
$\eqref{NIP_problem_floor}$ and the solution set $D^*_y$ of problem
$\eqref{NIP_problem}$, we can have the following algorithm for getting
one solution of problem $\eqref{NIP_problem}$:

1.  To find a
    $b \in D^{*}_b =\complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$.

    - Calculate
      $x=[x_1,x_2,\ldots,x_n],\forall i \in \{1,2,\ldots,n\},x_i = floor(r_iN)-r_iN$.

    - Calculate $m=N-\sum_{i=1}^n floor(r_iN)$,

      - From the conclusion $\eqref{floor_conclusion}$, there are
        $m \in \mathbb{Z},0 \le m < n$.

    - Let $\hat N = \{1,2,\ldots,n\}$,

    - and let
      $Q=\{\lambda^{n}|\lambda^{n}=(i_1,i_2,\ldots,i_n)\in {\hat N}^n, \forall u,v \in \hat N, u\ne v, i_u\ne i_v,  \forall s,t \in \hat N,s<t, x_{i_s}\le x_{i_t}\}$.

    - Get a $\lambda^n=(i_1,i_2,\ldots,i_n) \in Q$, there will be
      $\Lambda=\{i_1,i_2,\ldots,i_n\} = \hat N,x_{i_1}\le x_{i_2} \le \ldots \le x_{i_n}$.

    - According to the `8` of [appendix A.3](#A.3), consider a
      $b=[b_1,b_2,\ldots,b_n] \in \mathbb{Z}^n$ as:

      where
      $\forall s \in \{s|s \in [1,m], s \in \mathbb{Z}^+\} b_{i_s} = 1, \forall t \in \{t|t \in [m+1,n], t \in \mathbb{Z}^+\} b_{i_t} = 0$.

    {% note info %}

    In problem $\eqref{NIP_problem}$, the objective function $f(y)$ can
    guarantee **determinacy(reproducibility)** and **precision**.

    When it comes to the problem $\eqref{NIP_problem_floor}$, the
    objective function
    $(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$ can
    guarantee **determinacy(reproducibility)** and **precision**.

    But if to get 1 solution of the solution set $D^{*}_b$, the choosing
    method will incur new **non-determinacy**. To maintain the
    **determinacy(reproducibility)**, it should be deterministic that
    getting a $\lambda^n=(i_1,i_2,\ldots,i_n) \in Q$. That is when
    implementing, a stable sorting (see [appendix A.4](#A.4)) is needed.

    And, this will also bring about **fairness problem** as the
    aforesaid terms. That is, getting a
    $\lambda^n=(i_1,i_2,\ldots,i_n) \in Q$ is only determined by the
    sorting method when implementing, instead of choosing one over the
    other mathematically by some measuring function.

    When practice, some external priority rules can be used to finally
    choose a $\lambda^n=(i_1,i_2,\ldots,i_n) \in Q$. But that would be
    beyond the scope of this article.

    {% endnote %}

2.  According the $b\in D^{*}_b$ in `1`, calculate all the
    $y\in D^*_y=\{y|y=[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n],\\ \forall b=[b_1,b_2,\ldots,b_n]\in D^{*}_b\}$.

3.  Generally, this algorithm’s worst-case time complexity is $O(n^2)$,
    where the sorting accounts for the most computing time.

# Experiments

Here we implement the [algorithm to get 1 solution of the solution
set](#The Algorithm to Get 1 Solution of the Solution Set), along with
the testing.

- Define the implementation part. We use
  [Python](https://www.python.org/) to build the implementation as:

  ``` python
  #this file is ./datas_dividing.py
  import math
  from typeguard import typechecked

  @typechecked
  def get_dividing_nums(N:int,r:list[int|float])->list[int]:
      """
      According to https://little-train.com/posts/70807cc5.html.
      Calculate the number of elements in each divided part, 
      when splitting `N` elements into `len(r)` parts by a series
      of division proportions (`r`).

      Args: 
          N: the total numbers of elements.
          r: the series of division proportions.
              It is a float list as [r_1,r_2,...,r_n], where r_i
              represent `i-th` divided part should have about r_i*N elements.
          There should be sum(r)==1.0, 0<r_i<=1, N>=len(r)>=1
      Return:
          y: the number of elements in each divided part.
              It is a integer list as [y_1,y_2,...,y_n],  where y_i represts
              the `i-th` divided part's element number.
          There should be sum(y)==N.

      To determine/calculate the y, a division error is defined as:
        error(y,r,N) = (|y_1-r_1*N|^p+|y_2-r_2*N|^p+...+|y_n-r_n*N|^p)^(1/p),
          (p>1),where sum(y)==N.
      So, y = argmin(error)
      According to https://little-train.com/posts/70807cc5.html,
      we can get the `y` by following steps:
          1. calculate `x` = [x_1,x_2,...,x_n] where x_i = floor(r_i*N)-r_i*N
              calculate a estimated `y` = [y_1,y_2,...,y_n] where y_i = floor(r_i*N)
          2. get the sorted `ranks`(indices) of x by order from `small to large`,
              `ranks` = [rank_1,rank_2,...,rank_n]
              rank_i means if sort x, x[rank_i] is the i-th elements
          3. get `m` = N -(floor(r_1*N)+floor(r_2*N)+...+floor(r_n*N) )
          4. calculate a `bias_list` to modify x and get y
              if m>0 then `bias_list` = [1,1,...1,0,0,...,0],
                the first |m| elements are 1, the rest are 0 
              if m=0 then `bias_list` = [0,0,...,0]
          5. modify `y` = [y_1,y_2,...,y_n],
            where y[ranks[i]] = y[ranks[i]]+bias_list[i].
      The `1`~`5` will be optimized appropriately when implementing.

      NOTE For determinacy, the sorting function used should be stable.
          Luckily, python's built-in sorted() function is a stable one,
          see https://docs.python.org/3/library/functions.html#sorted
      """
      n = len(r)
      assert all(0<rate<=1 for rate in r)
      assert math.isclose(sum(r),1.0)
      assert 1<=n<=N
      x = [] # buf for index and `estimated-N*rate`
      y = [] # estimated list, y:list[estimated]

      for i,rate in enumerate(r):
          estimated = math.floor(N*rate)
          x.append((i,estimated-N*rate))
          y.append(estimated)
      x.sort(key=lambda i_v:i_v[-1])
      m = N-sum(y)
      assert m>=0
      # appliy bias for get each region's length, i.e., modify `y` (esitimated)
      for i,(sorted_index,_) in enumerate(x):
          if i+1 <= m:
              y[sorted_index] += 1
      return y
  ```

- Define the testing part. We use [Python](https://www.python.org/) with
  [`pytest`](https://docs.pytest.org/en/7.2.x/) to build the tests as:

  ``` python
  #this file is ./data_dividing_test.py
  import functools
  import math
  import pytest
  import random
  from utils.data_dividing_helper import get_dividing_nums

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

  @pytest.mark.parametrize('N',[2,3,5,10,20,33,79,100,999,114514,142857])
  @pytest.mark.parametrize('n',[1,2,3,5,6,7,8,9])
  @pytest.mark.parametrize('rate_seed',[0,1,2])
  @pytest.mark.parametrize('tweak_seed',[0,1,2,3,4,5])
  @pytest.mark.parametrize('p',[1,1.1,2,2.3,3])
  def test_datas_dividing(N,n,rate_seed,tweak_seed,p):
      if N<n:
          pass
      else:
          ratios = _gen_rate(n,rate_seed)
          targets = list(map(lambda r:r*N,ratios))
          dividing_nums = get_dividing_nums(N,ratios)
          assert len(dividing_nums)==n
          assert sum(dividing_nums)==N
          diff_p_norm1 = _diff_p_norm(dividing_nums,targets,ord=p)
          diff_p_norm2 = \
            _diff_p_norm(_tweak_i_j(dividing_nums,tweak_seed),targets,ord=p)
          assert diff_p_norm1<=diff_p_norm2
  ```

- Testing:

  - The testing commands is:

    ``` python
    python -m pytest .\data_dividing_test.py 
    ```

  - And, the result is `Test passed completely` as:

    <figure>
    <img
    src="https://raw.little-train.com/eb35932a6d9cf57ccf080fba6a9160dce43157a8ca6d65c41be25a2065dd5f9c.png"
    alt="test-result" />
    <figcaption aria-hidden="true">test-result</figcaption>
    </figure>

# Conclusion and Discussion

In this article, we have done the following things:

1.  From the [mathematics of
    apportionment](https://en.wikipedia.org/wiki/Mathematics_of_apportionment)
    problem in machine learning, we show the **rounding(decimal)** and
    **fairness** problems when dividing/partitioning/splitting a dataset
    of the same genre of elements by a series of proportions.
2.  We investigated current practices and found it does not pay much
    attention to the aforesaid problems.
3.  So, we tried to solve these problems.
    - We gave out a feasible standard with **non-omission**,
      **non-overlapping**, **determinacy(reproducibility)** and
      **precision** to indicate a rounding method/target to deal with
      the decimal problem.
    - According to the defined standard, we gave out objectives and
      requirements from the perspective of [mathematics
      apportionment](https://en.wikipedia.org/wiki/Mathematics_of_apportionment).
    - We designed the corresponding algorithms.
      - We designed an algorithm to get the whole solution set and
        proved its correctness theoretically
      - We designed an algorithm to get one solution of the solution set
        and proved its correctness theoretically.
      - We implemented the algorithm to get one solution of the solution
        set and did testing for it.

Other points:

- The **standard** and **method** posted in this article can help to
  split a dataset by a series of proportions in machine learning, with
  **non-omission**, **non-overlapping**,
  **determinacy(reproducibility)**, and **precision**.
  - The proposed division metric/error based on `p-norm` ($p>1$) is a
    reasonable indicator and with universality.
  - This method will be useful and exceptionally efficient when one
    wants to minimize the division metric/error.
  - When dividing, each data in the dataset is treated as identical,
    even though all of them are different from each other actually. That
    is, we hold the view that, the distribution in each divided subset
    conforms to the original distribution.
  - If one wants to realize random division on a dataset, we should:
    - consider the original dataset as an ordered list,
    - shuffle the original list first,
    - then apply the division method as aforesaid.
- The proof process in this article is complicated, where some lemmas
  are used to simplify the proof, but its logic is not confusing. The
  proofing procedure is very simple and smooth. It is a step-by-step
  progression, narrowing the feasible domain until achieving the target.

# Acknowledgments

Thanks to [@汪坤](https://www.zhihu.com/people/wang-kun-51-88)
[@WhoTFAmI](https://www.zhihu.com/people/WhoTFAmI) and
[@林凌](https://www.zhihu.com/people/lin-ling-43-27-55) for the initial
ideas and comments on the [知乎](https://www.zhihu.com/) problem
[如何不遗漏不重复地将列表元素按照指定比率划分？](https://www.zhihu.com/question/543548568),
which comes out with the solution that based on $floor(\cdot)$ function.

# Appendix

Details of some proofs for several issues are documented here.

## A.1

\$n,N ^+, n N \$, conside
$D_y = \{y|y=[y_1,y_2,\ldots,y_n]\in \mathbb{N}^n,\sum_{i=1}^{n}y_i=\|y\|_1=N\}$.
Except $\emptyset$, how many elements in $D_y$?

It equals to:

- How many ways to partition $N$ identical elements to $n$ groups,
  allowing $0$ element group?

It also equals to:

- How many ways to partition $N+n$ identical elements to $n$ groups,
  each group should has atleast $1$ element?

So, it equals to:

- How many ways to selection $n-1$ intervals for $N+n-1$ potential
  intervals?
- i.e., $\binom{N+n-1}{n-1}$

## Lemma 1

- Assertion:
  - Given set $V_1,V_2$, where $\emptyset \subsetneq V_1 \subseteq V_2$,
  - and given set $U\subset V_2$,
  - so, let $\complement_{V_2}U$ represents the complement of $U$ in
    $V_2$.
  - If $U\cap V_1=\emptyset$,
  - then, $\complement_{V_2}U \cap V_1 \ne \emptyset$.
- Proof:
  - Since $U\cap V_1=\emptyset$.
  - If $U=\emptyset$,
    - then $\complement_{V_2}U=V_2$.
    - According to the assertion, there is
      $\complement_{V_2}U \cap V_1 = V_2\cap V_1 = V_1\ne \emptyset$.
  - If $U \ne \emptyset$,
    - then, $\exists x\in V_1, x\notin U, x \in V_2$.
    - So, $x \in \complement_{V_2}U \cap V_1$,
    - i.e., $\complement_{V_2}U \cap V_1 \ne \emptyset$.

  Therefore, the [Lemma 1](#lemma 1) is proofed.

## Lemma 2

- Assertion:
  - Given set $V_1,V_2$, where $\emptyset \subsetneq V_1 \subseteq V_2$,
  - and given set
    $V^{*}_{1}=\{x|\mathop{\arg\min}\limits_{x\in V_1}f(x)\}$,
    $V^{*}_{2}=\{x|\mathop{\arg\min}\limits_{x\in V_2}f(x)\}$.
  - If $\exists x \in V^{*}_{2}$, and $x \in V_1$,
    - then, $x \in V^{*}_{1} \subseteq V^{*}_{2}$.
- Proof:
  - Obviously, there are $V_1^*\subseteq V_1 \subseteq V_2$, and
    $V_2^*\subseteq V_2$.
  - Since $\exists x \in V^{*}_{2}$, and $x \in V_1$,
  - so, $V_1\cap V_2^* \ne \emptyset$.
  - Assume $\exists \hat x \in V_1\cap V_2^*$ that
    $\hat x \notin V_1^*$,
    - so, $\hat x \in V_2^*, x\in V_1$, but $\hat x \notin V_1^*$.
    - So, $\forall \hat y \in V_1^* \subseteq V_2$, there is
      $f(\hat y)<f(\hat x)$.
    - So, $\hat x \notin V_2^*$, which is contrary to the logic of the
      above.
    - So, the assumption is not valid.
  - So, $\forall \hat x \in V_1\cap V_2^*$, there is $\hat x \in V_1^*$,
    i.e., $V_1\cap V_2^*\subseteq V_1^*$.
  - Assume $\exists \hat x \in V_1^*$ that
    $\hat x \notin V_1\cap V_2^*$,
    - so, $\hat x \in V_1^*, x\in V_1$, but $\hat x \notin V_2^*$.
    - So, $\forall \hat y \in V_2^* \subseteq V_2$, there is
      $f(\hat y)<f(\hat x)$.
    - So, $\forall \hat z \in V_1 \cap V_2^* \subseteq V_1$, there is
      $f(\hat z)<f(\hat x)$.
    - So, $\hat x \notin V_1^*$, which is contrary to the logic of the
      above.
    - So, the assumption is not valid.
  - So, $\forall \hat x \in V_1^*$, there is $\hat x \in V_1\cap V_2^*$,
    i.e., $V_1^* \subseteq V_1\cap V_2^*$.
  - Therefore, $V_1^*=V_1\cap V_2^*$.
  - So, $x \in V^{*}_{1} \subseteq V^{*}_{2}$ Therefore, the [Lemma
    2](#lemma 2) is proofed.

## A.2

Define a helper function and elaboration some features (conclusions) of
it.

- Let: $D_{[-1,0]}=\{x|-1\le x \le 0, x \in R\}$
- $\forall p> 1$, define $H(k,x):\{\mathbb{Z},D\}\rightarrow \mathbb{R}$
  as
- $H(k,x) =\begin{cases}|k+x|^{p}-|k+x-1|^{p},~k\ge 1, k \in \mathbb{Z},~x \in D_{[-1,0]}\\ -1,~k=0,~x \in D_{[-1,0]}\\ |k+x|^{p}-|k+x+1|^{p},k\le -1, k \in \mathbb{Z},~x \in D_{[-1,0]}\end{cases}$

Analysis: $\forall p> 1$

- If $k\ge2,k \in \mathbb{Z},~x \in D_{[-1,0]}$,
  - then, $k+x \ge 1 >0, k+x-1 \ge 0$.
  - $H(k,x)=|k+x|^{p}-|k+x-1|^{p}=(k+x)^p-(k+x-1)^p$
  - $\frac{\partial H(k,x)}{\partial x}=p(k+x)^{p-1}-p(k+x-1)^{p-1}> 0$
- If $k=1,~x \in D_{[-1,0]}$,
  - then, $k+x=1+x \ge 0, k+x-1=x\le 0$.
  - $H(k,x)=|1+x|^{p}-|x|^{p}=(1+x)^p-(-x)^p$
  - $\frac{\partial H(k,x)}{\partial x}=p(1+x)^{p-1}+p(-x)^{p-1}> 0$.
- If $k\le -2,k \in \mathbb{Z},~x \in D_{[-1,0]}$,
  - then, $k+x \le -2 < 0, k+x+1 \le -1 <0$.
  - $H(k,x)=|k+x|^{p}-|k+x+1|^{p}=(-k-x)^p-(-k-x-1)^p$
  - $\frac{\partial H(k,x)}{\partial x}=-p(-k-x)^{p-1}+p(-k-x-1)^{p-1} = -p[(-k-x)^{p-1}-(-k-x-1)^{p-1}]< 0$.
- If $k=-1,~x \in D_{[-1,0]}$,
  - then, $k+x = -1+x \le -1 < 0, k+x+1 = x \le 0$
  - $H(k,x)=|-1+x|^{p}-|x|^{p}=(1-x)^p-(-x)^p$
  - $\frac{\partial H(k,x)}{\partial x}=-p(1-x)^{p-1}+p(-x)^{p-1}=-p[(1-x)^{p-1}-(-x)^{p-1}]< 0$.
- $(I)\rightarrow$ So, when
  $k\ge1,k \in \mathbb{Z},~x \in D_{[-1,0]},p> 1$, the function
  $H(k,x)=(|k+x|^{p}-|k+x-1|^{p})$ is strictly monotonically increasing
  W.R.T. $x$.
- $(II)\rightarrow$ So, when
  $k\le -1,k \in \mathbb{Z},~x \in D_{[-1,0]},p> 1$, the function
  $H(k,x)=(|k+x|^{p}-|k+x+1|^{p})$ is strictly monotonically decreasing
  W.R.T. $x$. Then, consider the region
  $D_{(-1,0]}=\{x|-1< x \le 0, x \in R\}$ instead of $D_{[-1,0]}$.
  $\forall x_1,x_2\in D_{(-1,0]}$:
- When $k\ge 2$, according to $(I)$, there is: $$
  \begin{split}
  \inf_{x_1,x_2\in D_{(-1,0]}}[H(k,x_1)-H(k-1,x_2)]&=\inf_{x_1\in D_{(-1,0]}}H(k,x_1)-\sup_{x_2\in D_{(-1,0]}}H(k-1,x_2)\\
  &= \inf_{x_1\in D_{(-1,0]}}H(k,x_1)-\max_{x_2\in D_{(-1,0]}}H(k-1,x_2)\\
  &= H(k,-1)-H(k-1,0)\\
  &= (|k-1|^{p}-|k-2|^{p})-(|k-1|^{p}-|k-2|^{p})=0,
  \end{split}
  $$
  - And obviously, $\nexists x1,x2 \in (0,1]$, that make
    $H(k,x_1)-H(k-1,x_2)=0$.
  - Therefore, $H(k,x_1)>H(k-1,x_2)$.
- When $k=1$, according to $(I)$, there is: $$
  \begin{split}
  \inf_{x_1,x_2\in D_{(-1,0]}}[H(k,x_1)-H(k-1,x_2)]&=\inf_{x_1,x_2\in D_{(-1,0]}}[H(1,x_1)-H(0,x_2)]\\
  &=\inf_{x_1\in D_{(-1,0]}}[H(1,x_1)+1]\\
  &=\inf_{x_1\in D_{(-1,0]}}H(1,x_1)+1\\
  &= H(1,-1)+1\\
  &= (|1-1|^{p}-|-1|^{p})+1=0,
  \end{split}
  $$
  - And obviously, $\nexists x1,x2 \in D_{(-1,0]}$, that make
    $H(k,x_1)-H(k-1,x_2)=0$.
  - Therefore, $H(k,x_1)>H(k-1,x_2)$.
- $(III)\rightarrow$ So, when $k\ge1,k \in \mathbb{Z},p> 1$,
  $\forall x_1,x_2\in D_{(-1,0]}$, there is $H(k,x_1)>H(k-1,x_2)$
- When $k\le -2$, according to $(II)$, there is: $$
  \begin{split}
  \inf_{x_1,x_2\in D_{(-1,0]}}[H(k,x_1)-H(k+1,x_2)]&=\inf_{x_1\in D_{(-1,0]}}H(k,x_1)-\sup_{x_2\in D_{(-1,0]}}H(k+1,x_2)\\
  &= \min_{x_1\in D_{(-1,0]}}H(k,x_1)-\sup_{x_2\in D_{(-1,0]}}H(k+1,x_2)\\
  &= H(k,0)-H(k+1,-1)\\
  &= (|k|^{p}-|k+1|^{p})-(|k|^{p}-|k+1|^{p})=0,
  \end{split}
  $$
  - And obviously, $\nexists x1,x2 \in D_{(-1,0]}$, that make
    $H(k,x_1)-H(k+1,x_2)=0$.
  - Therefore, $H(k,x_1)>H(k+1,x_2)$.
- When $k= -1$, according to $(II)$, there is: $$
  \begin{split}
  \inf_{x_1,x_2\in D_{(-1,0]}}[H(k,x_1)-H(k+1,x_2)]&=\inf_{x_1,x_2\in D_{(-1,0]}}[H(-1,x_1)-H(0,x_2)]\\
  &=\inf_{x_1\in D_{(-1,0]}}[H(-1,x_1)+1]\\
  &=\min_{x_1\in D_{(-1,0]}}H(-1,x_1)+1\\
  &= H(0,-1)+1\\
  &= (|-1|^{p}-|0|^{p})+1=2>0,
  \end{split}
  $$
  - Therefore, $H(k,x_1)>H(k+1,x_2)$.
- $(IV)\rightarrow$ So, when $k\le -1,k \in \mathbb{Z},p> 1$,
  $\forall x_1,x_2\in D_{(-1,0]}$, there is $H(k,x_1)>H(k+1,x_2)$
  According to $(III)$ and $(IV)$, there is:
- When $k \in \mathbb{Z},p> 1$,
  $\forall x_1,x_2,\ldots,x_{\infty}\in D_{(-1,0]}$,
- $-1=H(0,x_1)< H(-1,x_1)< H(-2,x_2)<\ldots < H(-\infty,x_{\infty})$,
- and $-1=H(0,x_1)< H(1,x_1)< H(2,x_2)<\ldots < H(\infty,x_{\infty})$.
- Let’s call this a **special monotonicity property** of $k$.

## A.3

{% note info %}

For better readability, we divide the proof process into several parts
and analysis step by step, until the conclusion is reached.

{% endnote %}

1.  Preliminary illustrations:

    - Known conditions:
      - $n,N \in \mathbb{Z}^+, n \le N$
      - $p\in \mathbb{R},~p> 1$
      - $r = [r_1,r_2,\ldots,r_n]\in \mathbb{R}_+^n,\|r\|_{1}=1$
      - $floor(\cdot)$ is as $\eqref{floor}$
      - $m=N-\sum_{i=1}^n floor(r_iN)$,
        - From the conclusion $\eqref{floor_conclusion}$, there are
          $m \in \mathbb{Z},0 \le m < n$.
      - $x=[x_1,x_2,\ldots,x_n], \forall i \in \{1,2,\ldots,n\},x_i = floor(r_iN)-r_iN$.
    - Group $\{x_1,x_2,\ldots,x_n\}$ according their values as:
      - $\exists h\in \mathbb{Z}^+, h\le n, g_1,g_2,\ldots, g_h \in \mathbb{Z}^+,\sum_{i=1}^{h}g_i=n$,
        that make
        - $G_1 = \{i_1,i_2,\ldots,i_{g_1}\} \subseteq \{1,2,\ldots,n\}, \forall i_s,i_t \in G_1, x_{i_s}=x_{i_t}$.
        - $G_2 = \{i_{g_1+1},i_{g_1+1},\ldots,i_{g_1+g_2}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_2, x_{i_s}=x_{i_t}$.
        - …
        - $G_h = \{i_{1+\sum_{i=1}^{h-1}g_i},i_{2+\sum_{i=1}^{h-1}g_i},\ldots,i_{\sum_{i=1}^{h}g_i}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_h, x_{i_s}=x_{i_t}$.
        - $G_1 \cup G_2 \cup \ldots \cup G_h = \{1,2,\ldots,n\}$
        - $\forall s,t \in \{1,2,\ldots,h\}$ and $s\ne t$, there is
          $G_s \cap G_t \ne \emptyset$
        - $\forall s,t \in \{1,2,\ldots,h\}, s<t$, there is
          $\forall i_s \in G_s, i_t \in G_t$, that $x_{i_s}<x_{i_t}$.
        - Specially, if $h=1$, there will be
          $\forall i_s,i_t \in \{1,2,\ldots,n\}, x_{i_s}=x_{i_t}$
    - Define $$
      \begin{split}
      D_b=\{b|&b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m,\\&[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n\}
      \end{split}
      $$
    - Define
      $D^{'}_b=\{b|b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m\}$.
    - Define solutions set
      $D^{*}_b=\{b|b=\mathop{\arg\min}\limits_{b\in D_b}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}$.
    - Define solutions set
      $D^{*'}_b=\{b|b=\mathop{\arg\min}\limits_{b\in D^{'}_b}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}$.
    - There is $\emptyset \ne D_b$. Proof:
      - Since $m\ge 0$, so,
        $\exists b=[m,0,\ldots,0]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m$,
        that make
        $[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n$.
      - So, $\emptyset \ne D_b$ is proofed.

    So, there are
    $D_b\subseteq D^{'}_b, \emptyset \ne D^{*}_b\subseteq D_b,~\emptyset\ne D^{*'}_b \subseteq D^{'}_b$

2.  Let
    $B_1= \{b|b\in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m, \exists i_s,i_t \in \{1,2,\ldots,n\}~b_{i_s}\ge 1,b_{i_t}\le -1\}\subseteq D^{'}_b$,
    then there will be $D^{*'}_b \subseteq \complement_{D^{'}_b}B_1$.
    Proof:

    - Obviously, $B_1 \ne \emptyset$.
    - Assume that there
      $\exists b=[b_1,b_2,\ldots,b_n]\in D^{*'}_b\cap B_1$.
    - Without loss of generality, let $s<t$.
    - Define $b^{'}=[b^{'}_{1},b^{'}_{2},\ldots,b^{'}_{n}]$, where
      $b^{'}_{i_s}=b_{i_s}-1,b^{'}_{i_t}=b_{i_t}+1, \forall i \in \{i|i \in [1,n], i\in \mathbb{Z}, i \notin \{i_s,i_t\}\}, b^{'}_i=b_i$.
    - Obviously,there are:
      - $b^{'}\in D^{'}_b$,
      - $(I)\rightarrow$ and
        $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ge (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.
    - Also, according to the helper function $H(k,x)$ and the
      conclusions in [appendix A.2](#A.2), then: $$
      \begin{split}
      &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
      &=|b^{'}_{i_s}+x_{i_s} |^{p}+|b^{'}_{i_t}+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
      &=|b_{i_s}-1+x_{i_s}|^{p}+|b_{i_t}+1+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
      &=-(|b_{i_s}+x_{i_s}|^{p}-|b_{i_s}-1+x_{i_s}|^{p})-(|b_{i_t}+x_{i_t}|^{p}-|b_{i_t}+1+x_{i_t}|^{p})\\
      &=-H(b_{i_s},x_{i_s})-H(b_{i_t},x_{i_t})\\
      &<-\inf_{x\in(-1,0]}H(b_{i_s},x)-\inf_{x\in(-1,0]}H(b_{i_t},x)\\
      &=-H(b_{i_s},-1)-H(b_{i_t},0)\\
      &=-(|b_{i_s}-1|^{p}-|b_{i_s}-2|^{p})-(|b_{i_t}|^{p}-|b_{i_t}+1|^{p})\\
      &< 0\\
      \end{split}
      $$
    - so,
      $\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}< \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}$.
    - Therefore,
      $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} < (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$,
      which is contradictory to $(I)$, so the above assumption is not
      valid.
    - So, $D^{*'}_b\cap B_1 = \emptyset$, i.e.,
      $D^{*'}_b \subseteq \complement_{D^{'}_b}B_1$.

    So, `2` is proofed.

3.  Let
    $B_2= \{b|b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m,\exists i_s \in \{1,2,\ldots,n\}~b_{i_s}\ge 2\}\subseteq D^{'}_b$,
    then there will
    be,$D^{*'}_b \subseteq \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2$.

    Proof:

    - Obviously, $B_2 \ne \emptyset$.
    - Assume that there
      $\exists b=[b_1,b_2,\ldots,b_n]\in D^{*'}_b \cap B_2$.
    - So, $\exists i_s \in \{1,2,\ldots,n\}$, that $b_{i_s}\ge 2$.
    - The $D^{*'}_b \subseteq \complement_{D^{'}_b}B_1$ has been proofed
      in `2`, and $\emptyset\ne D^{*'}_b \subseteq D^{'}_b$ has been
      illustrated in `1`.
    - So, $b \in (D^{*'}_b \cap B_2)\subseteq \complement_{D^{'}_b}B_1$.
    - Since according to $\eqref{floor_conclusion}$, there is
      $0\le m=\sum_{i=1}^n b_i < n$. So,
      $\forall i \in \{1,2,\ldots,n\}~b_{i}\ge 0$, and there
      $\exists i_t\ne i_s$, that $b_{i_t}=0$.
    - Without loss of generality, let $i_s<i_t$.
    - Define $b^{'}=[b^{'}_{1},b^{'}_{2},\ldots,b^{'}_{n}]$, where
      $b^{'}_{i_s}=b_{i_s}-1,b^{'}_{i_t}=b_{i_t}+1, \forall i \in \{i|i \in [1,n], i\in \mathbb{Z}, i \notin \{i_s,i_t\}\}, b^{'}_i=b_i$.
    - Obviously,there are:
      - $b^{'}\in \complement_{D^{'}_b}B_1\subseteq D^{'}_b$,
      - $(I)\rightarrow$ and
        $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ge (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.
    - Also, according to the helper function $H(k,x)$ and the
      conclusions in [appendix A.2](#A.2), then: $$
      \begin{split}
      &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
      &=|b^{'}_{i_s}+x_{i_s}|^{p}+|b^{'}_{i_t}+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
      &=|b_{i_s}-1+x_{i_s}|^{p}+|b_{i_t}+1+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
      &=-(|b_{i_s}+x_{i_s}|^{p}-|b_{i_s}-1+x_{i_s}|^{p})+(|b_{i_t}+1+x_{i_t}|^{p}-|b_{i_t}+x_{i_t}|^{p})\\
      &=-H(b_{i_s},x_{i_s})+H(b_{i_t}+1,x_{i_t})\\
      &=-[H(b_{i_s},x_{i_s})-H(1,x_{i_t})]\\
      &<0.
      \end{split}
      $$
    - So,
      $\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}< \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}$.
    - Therefore,
      $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} < (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$,
      which is contradictory to $(I)$, so the above assumption is not
      valid.
    - So, $D^{*'}_b\cap B_2 = \emptyset$, i.e.,
      $D^{*'}_b \subseteq \complement_{D^{'}_b}B_2$.
    - Therefore,
      $D^{*'}_b \subseteq \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2$.

    So, `3` is proofed.

4.  Let

    $$
    \begin{split}
     B_3=\{b|&b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m,\\
     &h\in \mathbb{Z}^+,h\ge2, \\
     &\exists s,t \in \{1,2,\ldots,h\}, s < t,i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t},b_{i_s}< b_{i_t}\}\subseteq D^{'}_b,
     \end{split}
    $$ then there will be
    $D^{*'}_b \subseteq \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$.

    Proof:

    - Since $B_3$ is not a simple definition, we explain it first:
      - $h\in \mathbb{Z}^+$
      - If \$h, \$
        - $\exists s,t \in \{1,2,\ldots,h\}, s < t, i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t}$,
        - $\forall b \in B_3$, \$ b ^n,~\_{i=1}^n b_i = m\$, and
          $b_{i_s}< b_{i_t}$.
      - If $h=1$, $B_3 = \emptyset$.
    - If \$h, \$
      - Obviously, $B_3 \ne \emptyset$.
        - Assume that there
          $\exists b=[b_1,b_2,\ldots,b_n]\in D^{*'}_b \cap B_3$.
        - So, $\exists i_s \in G_s, i_t\in G_t$, that
          $b_{i_s}< b_{i_t}$.
        - And, there is $x_{i_s} < x_{i_t}$.
        - The
          $D^{*'}_b \subseteq \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2$
          has been proofed in `2`, and
          $\emptyset\ne D^{*'}_b \subseteq D^{'}_b$ has been illustrated
          in `1`.
        - So,
          $b \in (D^{*'}_b \cap B_3)\subseteq \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2$.
        - Since according to $\eqref{floor_conclusion}$, there is
          $0\le m=\sum_{i=1}^n b_i < n$, and according to
          $\complement_{D^{'}_b}B_1\cap\complement_{D^{'}_b}{B_2}$’s
          field, there is
          $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,1\}$.
        - So, $b_{i_s}=0, b_{i_t} = 1$.
        - Define $b^{'}=[b^{'}_{1},b^{'}_{2},\ldots,b^{'}_{n}]$, where
          $b^{'}_{i_s}=b_{i_s}+1,b^{'}_{i_t}=b_{i_t}-1, \forall i \in \{i|i \in [1,n], i\in \mathbb{Z}, i \notin \{i_s,i_t\}\}, b^{'}_i=b_i$.
        - Obviously,there are:
          - $b^{'}\in (\complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2) \subseteq D^{'}_b$,
          - $(I)\rightarrow$ and
            $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ge (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.
        - Also, according to the helper function $H(k,x)$ and the
          conclusions in [appendix A.2](#A.2), then: $$
          \begin{split}
          &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
          &=|b^{'}_{i_s}+x_{i_s}|^{p}+|b^{'}_{i_t}+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
          &=|b_{i_s}+1+x_{i_s}|^{p}+|b_{i_t}-1+x_{i_t}|^{p}-|b_{i_s}+x_{i_s}|^{p}-|b_{i_t}+x_{i_t}|^{p}\\
          &=(|b_{i_s}+1+x_{i_s}|^{p}-|b_{i_s}+x_{i_s}|^{p})-(|b_{i_t}+x_{i_t}|^{p}-|b_{i_t}-1+x_{i_t}|^{p})\\
          &=H(b_{i_s}+1,x_{i_s})-H(b_{i_t},x_{i_t})\\
          &=H(1,x_{i_s})-H(1,x_{i_t})\\
          &< 0.
          \end{split}
          $$
        - So,
          $\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}< \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}$.
        - Therefore,
          $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} < (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$,
          which is contradictory to $(I)$, so the above assumption is
          not valid.
        - So, $D^{*'}_b\cap B_3 = \emptyset$, i.e.,
          $D^{*'}_b \subseteq \complement_{D^{'}_b}B_3$.
    - If $h=1$, ,then $B_3 = \emptyset$, and there is till
      $D^{*'}_b \subseteq \complement_{D^{'}_b}B_3$.

    Therefore,
    $D^{*'}_b \subseteq \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$

    So, `4` is proofed.

5.  Since
    $\emptyset \ne D^{*'}_b \subseteq \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$,
    there is
    $D^{*'}_b = \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$.

    Proof:

    Since: $$
    \begin{split}
     B_1= \{b|&b\in \mathbb{Z}^n,\sum_{i=1}^n b_i = m, \exists i_s,i_t \in \{1,2,\ldots,n\},b_{i_s}\ge 1,b_{i_t}\le -1\}\subseteq D^{'}_b\\
     B_2= \{b|&b \in \mathbb{Z}^n,\sum_{i=1}^n b_i = m, \exists i_s \in \{1,2,\ldots,n\}, b_{i_s}\ge 2\}\subseteq D^{'}_b\\
     B_3=\{b|&b \in \mathbb{Z}^n,~\sum_{i=1}^n b_i = m,\\
     &h\in \mathbb{Z}^+,h\ge2, \\
     &\exists s,t \in \{1,2,\ldots,h\}, s < t,i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t},b_{i_s}< b_{i_t}\}\subseteq D^{'}_b\\
     \end{split}
    $$ And according to $\eqref{floor_conclusion}$, there is
    $0\le m < n$, so,
    $\forall b=[b_1,b_2,\ldots,b_n] \in \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}  B_2 \cap \complement_{D^{'}_b}B_3$,
    there are:

    - $\sum_{i=1}^n b_i = m$
    - $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,1\}$
    - $h\in \mathbb{Z}^+$
    - If \$h, \$
      - $\forall s,t \in \{1,2,\ldots,h\}, s < t, i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t}$,
        there is $b_{i_s} \ge b_{i_t}$
      - If $m = 0$,
        - then $\forall i \in \{1,2,\ldots,n\}~b_{i}=0$, i.e.,
          $b=\theta$.
        - And the set \$ \_{D^{‘}*b}B_1 *{D<sup>{’}*b}B_2
          *{D</sup>{’}\_b}B_3 = {b=}\$, which is a single element set.
        - so,
          $D^{*'}_b = \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$
      - If $m > 0$, there will be
        $\exist h^{'} \in \{1,2,\ldots,h\} \sum_{i=1}^{h^{'}-1}g_i \le m < \sum_{i=1}^{h^{'}}g_i$.
        - If \$\_{i=1}<sup>{h</sup>{’}-1}g_i = m \$,
          - then
            $\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=1$.
          - and,
            $\forall i \in G_{h^{'}} \cup G_{h^{'}+1} \cup \ldots \cup G_{h}, b_{i}=0$.
          - And the set \$ \_{D^{‘}*b}B_1 *{D<sup>{’}*b}B_2
            *{D</sup>{’}\_b}B_3 = {b}\$, which is a single element set.
          - So,
            $D^{*'}_b = \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$
        - If $\sum_{i=1}^{h^{'}-1}g_i < m < \sum_{i=1}^{h^{'}}g_i$,
          - then
            $\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=1$.
          - let $q = m-\sum_{i=1}^{h^{'}-1}g_i$:
            - Obviously, $1\le q < g_{h^{'}}$.
            - Let
              $Q=\{\lambda^{q}|\lambda^{q}=(i_1,i_2,\ldots,i_q)\in G_{h^{'}}^q, \forall u,v \in \{1,2,\ldots,q\}, i_u\ne i_v\}$,
            - there is
              $\forall \lambda^q=(i_1,i_2,\ldots,i_q) \in Q, \Lambda=\{i_1,i_2,\ldots,i_q\} \subsetneq G_{h^{'}}$
            - $\forall i\in \{i_1,i_2,\ldots,i_q\}, b_i = 1$,
            - and
              $\forall i \in \complement_{G_{h^{'}}}^{\Lambda}, b_i = 0$
          - and,
            $\forall i \in G_{h^{'}+1} \cup G_{h^{'}+2} \cup \ldots \cup G_{h}, b_{i}=0$.
          - So, the set \$ \_{D^{‘}*b}B_1 *{D<sup>{’}*b}B_2
            *{D</sup>{’}\_b}B_3\$, is not a single element set. It has
            $\binom{g_{h^{'}}}{q} >1$ elements.
          - Assume
            $\exists b^{'}=[b^{'}_{1},b^{'}_{2},\ldots,b^{'}_{n}] \in \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3, b^{'}\ne b$,
            that
            make$(I)\rightarrow (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ne (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.
            - So,
              $\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=b^{'}_{i}=1$.
            - $\exists \emptyset \ne U=\{u_1,u_2,\ldots,u_{\sigma}\} \subseteq G_{h^{'}}$,
              $\emptyset \ne V=\{v_1,v_2,\ldots,v_{\sigma}\} \subseteq G_{h^{'}}$,$U\cap V = \emptyset, U\cup V \subseteq G_{h^{'}}$,
              - where $\forall i_u \in U, b_{i_u}=1,b^{'}_{i_u}=0$,
              - and $\forall i_v \in V, b_{i_v}=0,b^{'}_{i_v}=1$.
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
            which is contradictory to $(I)$, so the above assumption is
            not valid.
          - So,
            $\forall b^{'} \in \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3, b^{'}\ne b$,
            there is
            $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} = (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.
          - so,
            $D^{*'}_b = \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$
    - If $h = 1$, then $B_3 = \emptyset$, $G_1 = \{1,2,\ldots,n\}$
      - If $m = 0$,
        - then $\forall i \in \{1,2,\ldots,n\}~b_{i}=0$, i.e.,
          $b=\theta$.
        - And the set \$ \_{D^{‘}*b}B_1 *{D<sup>{’}*b}B_2
          *{D</sup>{’}\_b}B_3 = {b=}\$, which is a single element set.
        - so,
          $D^{*'}_b = \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$
      - If $m > 0$, there will be $0< m < n$.
        - let $q = m$:
          - Obviously, $1\le q < n$.
          - Let
            $Q=\{\lambda^{q}|\lambda^{q}=(i_1,i_2,\ldots,i_q)\in G_{1}^q, \forall u,v \in \{1,2,\ldots,q\}, i_u\ne i_v\}$,
            there is $\Lambda=\{i_1,i_2,\ldots,i_q\} \subsetneq G_{1}$
          - $\forall i\in \{i_1,i_2,\ldots,i_q\}, b_i = 1$,
          - and $\forall i \in \complement_{G_{1}}^{\Lambda}, b_i = 0$.
        - So, the set \$ \_{D^{‘}*b}B_1 *{D<sup>{’}*b}B_2
          *{D</sup>{’}\_b}B_3\$, is not a single element set. It has
          $\binom{g_{1}}{q}=\binom{n}{m}>1$ elements.
        - Assume
          $\exists b^{'}=[b^{'}_{1},b^{'}_{2},\ldots,b^{'}_{n}] \in \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3, b^{'}\ne b$,
          that
          make$(II)\rightarrow (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} \ne (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.
        - So,$\exists \emptyset \ne U=\{u_1,u_2,\ldots,u_{\sigma}\} \subseteq G_{1}$,
          $\emptyset \ne V=\{v_1,v_2,\ldots,v_{\sigma}\} \subseteq G_{1}$,$U\cap V = \emptyset, U\cup V \subseteq G_{1}$,
          - where $\forall i_u \in U, b_{i_u}=1,b^{'}_{i_u}=0$,
          - and $\forall i_v \in V, b_{i_v}=0,b^{'}_{i_v}=1$.
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
          which is contradictory to $(II)$, so the above assumption is
          not valid.
        - So,
          $\forall b^{'} \in \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3, b^{'}\ne b$,
          there is
          $(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}} = (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}$.
        - so,
          $D^{*'}_b = \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$

    So, `5` is proofed.

6.  Since
    $D^{*'}_b = \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$,
    there is
    $D^{*}_b = \complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$.
    Proof:

    - Since $$
      \begin{split}
        D_b=\{b|&b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m,\\&[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n\}\\
      D^{'}_b=\{b|&b=[b_1,b_2,\ldots,b_n]\in \mathbb{Z}^n,\sum_{i=1}^n b_i=m\}.\\
      D^{*}_b=\{b|&b=\mathop{\arg\min}\limits_{b\in D_b}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}\\
      D^{*'}_b=\{b|&b=\mathop{\arg\min}\limits_{b\in D^{'}_b}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}
      \end{split}
      $$
    - And
      $D_b\subseteq D^{'}_b, \emptyset \ne D^{*}_b\subseteq D_b,~\emptyset\ne D^{*'}_b \subseteq D^{'}_b$
      has been illustrated in `1`.
    - According to $\eqref{floor_conclusion}$, there is $0\le m < n$,
      so,
      $\forall b=[b_1,b_2,\ldots,b_n] \in D^{*'}_b=\complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$,
      there are:
      - $\sum_{i=1}^n b_i = m$
      - $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,1\}$
      - so, there will always be
        $[floor(r_1N)+b_1,floor(r_2N)+b_2,\ldots,floor(r_nN)+b_n]\in \mathbb{N}^n$
      - so, $b\in D_b$
      - according according to [lemma 2](#Lemma 2), there is
        $b\in D^{*}_b \subseteq D^{*'}_b$.
    - So, there is also $D^{*'}_b \subseteq D^{*}_b$
    - So,
      $D^{*}_b = D^{*'}_b =\complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$

    So, `6` is proofed.

7.  To find all
    $b \in D^{*}_b =\complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$.
    $\forall b=[b_1,b_2,\ldots,b_n] \in D^{*}_b =\complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$

    - If \$h, \$ so
      $\forall s,t \in \{1,2,\ldots,h\}, s < t, i_s \in G_s, i_t\in G_t, x_{i_s} < x_{i_t}$,
      there is $b_{i_s} \ge b_{i_t}$
      - If $m = 0$,
        - then $\forall i \in \{1,2,\ldots,n\}~b_{i}=0$, i.e.,
          $b=\theta$.
        - And the set \$ \_{D^{‘}*b}B_1 *{D<sup>{’}*b}B_2
          *{D</sup>{’}\_b}B_3 = {b=}\$, which is a single element set.
        - So, $D^{*}_b=\{\theta\}$, which is a single element set.
      - If $m > 0$, there will be
        $\exist h^{'} \in \{1,2,\ldots,h\} \sum_{i=1}^{h^{'}-1}g_i \le m < \sum_{i=1}^{h^{'}}g_i$.
        - If \$\_{i=1}<sup>{h</sup>{’}-1}g_i = m \$,
          - then
            $\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=1$.
          - and,
            $\forall i \in G_{h^{'}} \cup G_{h^{'}+1} \cup \ldots \cup G_{h}, b_{i}=0$.
          - And the set \$ \_{D^{‘}*b}B_1 *{D<sup>{’}*b}B_2
            *{D</sup>{’}\_b}B_3 = {b}\$, which is a single element set.
          - So $$
            \begin{split}
            D^{*}_b = \{b|&b = [b_1,b_2,\ldots,b_n]\\
            &\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=1,\\
            &\forall i \in G_{h^{'}} \cup G_{h^{'}+1} \cup \ldots \cup G_{h}, b_{i}=0\}
            \end{split}
            $$
          - The $D^{*}_b$ is a single element set.
        - If $\sum_{i=1}^{h^{'}-1}g_i < m < \sum_{i=1}^{h^{'}}g_i$,
          - then
            $\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=1$.
          - let $q = m-\sum_{i=1}^{h^{'}-1}g_i$:
            - Obviously, $1\le q < g_{h^{'}}$.
            - Let
              $Q=\{\lambda^{q}|\lambda^{q}=(i_1,i_2,\ldots,i_q)\in G_{h^{'}}^q, \forall u,v \in \{1,2,\ldots,q\}, i_u\ne i_v\}$,
            - there is
              $\forall \lambda^q=(i_1,i_2,\ldots,i_q) \in Q, \Lambda=\{i_1,i_2,\ldots,i_q\} \subsetneq G_{h^{'}}$
            - $\forall i\in \{i_1,i_2,\ldots,i_q\}, b_i = 1$,
            - and
              $\forall i \in \complement_{G_{h^{'}}}^{\Lambda}, b_i = 0$
          - and,
            $\forall i \in G_{h^{'}+1} \cup G_{h^{'}+2} \cup \ldots \cup G_{h}, b_{i}=0$.
          - So, the set \$ \_{D^{‘}*b}B_1 *{D<sup>{’}*b}B_2
            *{D</sup>{’}\_b}B_3\$, is not a single element set. It has
            $\binom{g_{h^{'}}}{q}>1$ elements.
          - So $$
            \begin{split}
            D^{*}_b = \{b|&b = [b_1,b_2,\ldots,b_n],\\
            &\forall i \in G_1 \cup G_2 \cup \ldots \cup G_{h^{'}-1}, b_{i}=1,\\
            &q = m-\sum_{i=1}^{h^{'}-1}g_i,\\
            &Q=\{\lambda^{q}|\lambda^{q}=(i_1,i_2,\ldots,i_q)\in G_{h^{'}}^q, \forall u,v \in \{1,2,\ldots,q\}, i_u\ne i_v\}\\
            &\forall \lambda^q=(i_1,i_2,\ldots,i_q) \in Q, \Lambda=\{i_1,i_2,\ldots,i_q\} \subsetneq G_{h^{'}},\\
            &~~~~\forall i\in \{i_1,i_2,\ldots,i_q\}, b_i = 1,\\
            &~~~~\forall i \in \complement_{G_{h^{'}}}^{\Lambda}, b_i = 0\\
            &\forall i \in G_{h^{'}+1} \cup G_{h^{'}+2} \cup \ldots \cup G_{h}, b_{i}=0\}
            \end{split}
            $$
          - The $D^{*}_b$ has $\binom{g_{h^{'}}}{q}>1$ elements.
    - If $h = 1$, then $B_3 = \emptyset$, $G_1 = \{1,2,\ldots,n\}$
      - If $m = 0$,
        - then $\forall i \in \{1,2,\ldots,n\}~b_{i}=0$, i.e.,
          $b=\theta$.
        - And the set \$ \_{D^{‘}*b}B_1 *{D<sup>{’}*b}B_2
          *{D</sup>{’}\_b}B_3 = {b=}\$, which is a single element set.
        - So, $D^{*}_b=\{\theta\}$, which is a single element set.
      - If $m > 0$, there will be $0< m < n$.
        - let $q = m$:
          - Obviously, $1\le q < n$.
          - Let
            $Q=\{\lambda^{q}|\lambda^{q}=(i_1,i_2,\ldots,i_q)\in G_{1}^q, \forall u,v \in \{1,2,\ldots,q\}, i_u\ne i_v\}$,
            there is $\Lambda=\{i_1,i_2,\ldots,i_q\} \subsetneq G_{1}$
          - $\forall i\in \{i_1,i_2,\ldots,i_q\}, b_i = 1$,
          - and $\forall i \in \complement_{G_{1}}^{\Lambda}, b_i = 0$.
        - So, the set \$ \_{D^{‘}*b}B_1 *{D<sup>{’}*b}B_2
          *{D</sup>{’}\_b}B_3\$, is not a single element set. It has
          $\binom{g_{1}}{q}=\binom{n}{m}>1$ elements.
        - So $$
          \begin{split}
          D^{*}_b = \{b|&b = [b_1,b_2,\ldots,b_n],\\
          &G_1 = \{1,2,\ldots,n\},\\
          &q = m,\\
          &Q=\{\lambda^{q}|\lambda^{q}=(i_1,i_2,\ldots,i_q)\in G_{1}^q, \forall u,v \in \{1,2,\ldots,q\}, i_u\ne i_v\}\\
          &\forall \lambda^q=(i_1,i_2,\ldots,i_q) \in Q, \Lambda=\{i_1,i_2,\ldots,i_q\} \subsetneq G_{1},\\
          &~~~~\forall i\in \{i_1,i_2,\ldots,i_q\}, b_i = 1,\\
          &~~~~\forall i \in \complement_{G_{1}}^{\Lambda}, b_i = 0\}
          \end{split}
          $$
        - The $D^{*}_b$ has $\binom{g_{1}}{q}=\binom{n}{m}>1$ elements.

8.  Give out a
    $b \in D^{*}_b = D^{*'}_b =\complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$.

    - Since,
      $x=[x_1,x_2,\ldots,x_n], \forall i \in \{1,2,\ldots,n\},x_i = floor(r_iN)-r_iN$.

    - Let $\hat N = \{1,2,\ldots,n\}$,

    - and
      $Q=\{\lambda^{n}|\lambda^{n}=(i_1,i_2,\ldots,i_n)\in {\hat N}^n, \forall u,v \in \hat N, u\ne v, i_u\ne i_v,  \forall s,t \in \hat N,s<t, x_{i_s}\le x_{i_t}\}$,

    - So, there is
      $\forall \lambda^n=(i_1,i_2,\ldots,i_n) \in Q, \Lambda=\{i_1,i_2,\ldots,i_n\} = \hat N$,
      $x_{i_1}\le x_{i_2} \le \ldots \le x_{i_n}$.

    - And according `1`, $\forall \lambda^n=(i_1,i_2,\ldots,i_n) \in Q$

    - $\exists h\in \mathbb{Z}^+, h\le n, g_1,g_2,\ldots, g_h \in \mathbb{Z}^+,\sum_{i=1}^{h}g_i=n$,
      that make

      - $G_1 = \{i_1,i_2,\ldots,i_{g_1}\} \subseteq \{1,2,\ldots,n\}, \forall i_s,i_t \in G_1, x_{i_s}=x_{i_t}$.
      - $G_2 = \{i_{g_1+1},i_{g_1+1},\ldots,i_{g_1+g_2}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_2, x_{i_s}=x_{i_t}$.
      - …
      - $G_h = \{i_{1+\sum_{i=1}^{h-1}g_i},i_{2+\sum_{i=1}^{h-1}g_i},\ldots,i_{\sum_{i=1}^{h}g_i}\} \subseteq \{1,2,\ldots,n\}  \forall i_s,i_t \in G_h, x_{i_s}=x_{i_t}$.
      - $G_1 \cup G_2 \cup \ldots \cup G_h = \{1,2,\ldots,n\}$
      - $\forall s,t \in \{1,2,\ldots,h\}$ and $s\ne t$, there is
        $G_s \cap G_t \ne \emptyset$
      - $\forall s,t \in \{1,2,\ldots,h\}, s<t$, there is
        $\forall i_s \in G_s, i_t \in G_t$, that $x_{i_s}<x_{i_t}$.
      - $\lambda^n=(i_1,i_2,\ldots,i_n)=(i_1,i_2,\ldots,i_{g_1},i_{g_1+1},i_{g_1+1},\ldots,i_{g_1+g_2},i_{1+\sum_{i=1}^{h-1}g_i},i_{2+\sum_{i=1}^{h-1}g_i},\ldots,i_{\sum_{i=1}^{h}g_i})$

    - $(I)\rightarrow$Consider a
      $b=[b_1,b_2,\ldots,b_n] \in \mathbb{Z}^n$ as:

      - Let $m=N-\sum_{i=1}^n floor(r_iN)$,
        - From the conclusion $\eqref{floor_conclusion}$, there are
          $m \in \mathbb{Z},0 \le m < n$.
      - where
        $\forall s \in \{s|s \in [1,m], s \in \mathbb{Z}^+\} b_{i_s} = 1, \forall t \in \{t|t \in [m+1,n], t \in \mathbb{Z}^+\} b_{i_t} = 0.$

    - Obviously,

      - $b \in D^{'}_b$.
      - $b \in \complement_{D^{'}_b}B_1$, since
        $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,1\}$.
      - $b \in \complement_{D^{'}_b}B_2$, since
        $\forall i \in \{1,2,\ldots,n\}~b_{i}\in \{0,1\}$.

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
      - so, $b \in \complement_{D^{'}_b}B_3$.

    - If $h=1$, then $B_3 = \emptyset$, there is
      $b \in \complement_{D^{'}_b}B_3$

    - So, the $b$ of $(I)$ satisfices
      $b \in D^{*}_b = D^{*'}_b =\complement_{D^{'}_b}B_1 \cap \complement_{D^{'}_b}B_2 \cap \complement_{D^{'}_b}B_3$

Along the above 8 points, the [method](#Method) is proofed totally.

## A.4

Here are some standards or explanations of a stable sorting algorithm:

- A sort is stable if it guarantees not to change the relative order of
  elements that compare equal — this is helpful for sorting in multiple
  passes (for example, sort by department, then by salary grade).[^4]
- [Stable sorting
  algorithms](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability)
  maintain the relative order of records with equal keys (i.e.,
  values).[^5]See
  [here](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability) for
  more information.

[^1]: 《Mathematics of apportionment》, . 2024年3月23日. 见于: 2024年5月18日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=Mathematics_of_apportionment&oldid=1215159951

[^2]: 《Mathematics of apportionment》, . 2024年3月23日. 见于: 2024年5月18日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=Mathematics_of_apportionment&oldid=1215159951

[^3]: 《Mathematics of apportionment》, . 2024年3月23日. 见于: 2024年5月18日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=Mathematics_of_apportionment&oldid=1215159951

[^4]: 《Built-in Functions》, Python documentation. 见于: 2024年5月22日. \[在线\]. 载于: https://docs.python.org/3/library/functions.html#sorted

[^5]: 《Sorting algorithm》, . 2024年3月19日. 见于: 2024年5月22日. \[在线\]. 载于: https://en.wikipedia.org/w/index.php?title=Sorting_algorithm&oldid=1214598553#Stability
