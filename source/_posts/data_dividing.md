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
updated: "2024-03-16 11:39:25"
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
these processes. <!-- more -->

# Introduction

First, let’s look at an example, i.e., how to divide a dataset
consisting of all $248$ positive samples into train set, validate set
and test set, according to proportions $0.7,0.1,0.2$? Not how to program
it, but how to determine the number of elements in each set? Simply
multiplying the total number of elements by the ratio will result in a
fractional part:

$$
\begin{aligned}
&train~set: &248\times0.7=173.6\\
&validate~set: &248\times0.1=24.8\\
&test~set: &248\times0.2=49.6
\end{aligned}
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
into parts by proportions, we need to do the following things:

- Set a general partition standard, do not divide haphazardly without
  basis. Therefore, we give out a partition **standard**:

  - **No omission**: Do not drop any element, as
    `sklearn.model_selection.train_test_split` does. It is difficult to
    find a reason to drop a particular element in a dataset. Why discard
    this element but not drop others else? It would be reckless to
    discard elements at will just because of the decimal problem
    (integer division problem). And, if some elements have been dropped,
    the dataset will a subset of the original one from the beginning,
    which will incur further problems in the theory section,
    particularly in the circumstance of small-size datasets. So, the
    best way is not to miss any element.

  - **No overlapping**: Do not make any 2 divided partitions overlap.
    Overlapping, i.e., the same element appearing in 2 partitions
    simultaneously, can directly lead to a bad division that unable to
    use. For example, in machine learning, the overlapping between train
    set and test set is a serious and principled error that should not
    be allowed to occur.

  - **Determinacy(Reproducibility)**: For a determined rate, the
    partition result should be deterministic. So, anyone can reproduce
    the result if the element total number and proportions known.
    Determinism is very important. Let alone the other problems of
    random seeds, weight initialization, and distribution training’s
    prioritization, how can we let others to successfully reproduce the
    experimental results in our papers if the partitioning results are
    uncertain and there may be no consistency even on divided datasets?

  - **Precision**: Make the division result closest to the one that the
    given ratios expect. Multiply the total number with proportions as
    the desired division result, which can be considered as a vector,
    although its value may not be integers. Consider the actual result
    also a vector, which must be integers as result. We want to make the
    p-norm distance between desired vector and actual vector obtain
    minimum value.

  - **Simplicity**: Simple and easy to use, with low complexity of the
    algorithm when implemented by computer.

  - **Universality**: Can work in any situation where a list of elements
    is needed to be divided by meaningful proportions and is not limited
    to only divide machine learning datasets.

- According to the defined standard, give out objectives and
  requirements described in mathematical terms:

  - Problem conditions and statements:

    - Given a list $L$ of $N$ elements, i.e., $L=[l_0,l_1,...,l_{N-1}]$,
      where $N\in \mathbb{Z^+}$.

    - Given a list of proportions $r$, where
      $r=[r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1, n,n\in \mathbb{Z^+}, n \leq N$.

    - Given a $p, p\in \mathbb{R}, p\geq 1$. Divide $L$ into $n$ parts
      by $r$.

    - Define result vector $y=[y_1,y_2,...,y_n]\in \mathbb{N^n}$, where
      $y_i$ represents the element numbers in the $i$-th divided parts.

    - The constraint $n\leq N$ is needful to exclude many unrealistic
      scenarios. Because if $n>N$, there must be at least one divided
      part that possess no element, which is a meaningless thing since
      we cannot determine which part should have no element when treat
      each part equally without caring about its weighting. And even if
      we know in advance which part (has no element) to be excluded, we
      can modify the corresponding ratio $r_i$ in advance, instead of
      reserving it and increasing complexity.

  - Questions, requests and explanations:

    - Try to find a list
      $y^* = [y^*_1,y^*_2,...,y^*_n]\in \mathbb{N^n}$, where
      $y^*\in Y^*=\{y|y=\mathop{\arg\min}\limits_{y\in \mathbb{N^n},\|y\|_1=N}(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}\}$.

    - Avoid exhaustive enumeration as far as possible.

    - Ensure the determinism and non-ambiguity of $y^*$.

    - Obviously, any non-zero vector in $Y^*$ meets all stuff in the
      above standard. But there may remain some confusion things that
      how the standard **No omission**, **No overlapping**,
      **Determinacy**, and **Simplicity** are met. We explain here:

      - The constraint $y\in \mathbb{N^n},\|y\|_1=N$ are equivalent to
        the constraint $y\in \mathbb{N^n},\sum_{i=1}^{n}y_i=N$

      - As long as $y\in \mathbb{N^n},\sum_{i=1}^{n}y_i=N$, the $L$ will
        be divided into exactly $n$ parts, naturally, there will be **no
        omission** and **no overlapping**.

      - It is difficult to find all the $y^*\in Y^*$, because there may
        be some equivalence $y^*$ when $\exists i,j, that~r_i=r_j$. In
        this case, only exhaustive enumeration can find all the
        $y^*\in Y^*$. But when practicing, it is meaningless to look for
        all the solutions and the overhead of exhaustive enumeration
        should be avoided. Whether or not there are multiple equivalent
        solutions, what we need is a definite solution generated by a
        fixed and simple pattern, instead of hanging multiple solutions
        that need to be determined by ourselves. So, we should design a
        pattern to make $y*$ deterministic and without ambiguity,
        reducing exhaustive enumeration as far as possible. Therefore,
        **Determinacy**, and **Simplicity** are met

- Design algorithms for the defined standard.

  - Get list $L=[l_0,l_1,...,l_{N-1}]$

  - Define the representation of the interval from $L$, i.e.,
    \$\[i_a,i_b\],i_ai_b,~i_a,i_b \$, which represents a set with
    elements that corresponding with indexes set
    $\{i_a,i_a+1,...,i_b\}$.

  - Calculate a $y^*=[y^*_1,y^*_2,...,y^*_n]\in \mathbb{N^n}$ to meet
    the above standard, where $y^{*}_{i}$ represents the element numbers
    in the $i$-th divided parts, i.e.,

    - find and apply algorithms to solve a Nonlinear Integer Programming
      (NIP) problem:

      $$
      \begin{equation}\label{NIP_problem}\tag{1}
      \begin{aligned}
        \text{known:}~~~~&n,N \in \mathbb{Z^+}, n \leq N\\
        &p\in \mathbb{R},~p\geq 1\\
        &r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1\\
        \text{minimize:}~~~~&(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}\\
        \text{subject to:}~~~~&~y = [y_1,y_2,...,y_n]\in \mathbb{N^n}\\
        &\sum_{i=1}^{n}y_i=N\\
        \end{aligned}
      \end{equation}
      $$

    - And it’s better to keep the time complexity of the algorithm not
      more than $O(n^2)$.

    - Ensure the determinism and non-ambiguity of $y*$ when this NIP
      problem’s solution is not unique.

  - Divide $L$ into several interval, i.e.,
    $[0,y^*_1-1],[y^*_1,y^*_1+y^*_2-1],...,[\sum_{i=1}^{n-1}y^*_i~,(\sum_{i=1}^{n}y^*_i)-1]$,
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
explain it in more detail.

## Domain and range analysis

To solve the NIP problem $\eqref{NIP_problem}$, we need to known why we
cannot just use $round(\cdot)$ function directly to divide elements in
$L$? Let’s focus on the following function $f(r,n,N)$:

$$
\begin{equation}\label{round}\tag{2}
\begin{aligned}
f(r,n,N)&=[\sum_{i=1}^n round(r_{i}N)]-N,\\
\text{where }& n,N \in \mathbb{Z^+}, n \leq N,\\
&r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1.\\
\end{aligned}
\end{equation}
$$

What is the specific definition of $round(\cdot)$? According to [IEEE
754](https://en.wikipedia.org/wiki/IEEE_754), there are five rounding
rules:

- Rounding to nearest

  - **[Round to nearest, ties to
    even](https://en.wikipedia.org/wiki/Rounding#Round_half_to_even)** –
    rounds to the nearest value; if the number falls midway, it is
    rounded to the nearest value with an even least significant
    digit.[^1]

  - **[Round to nearest, ties away from
    zero](https://en.wikipedia.org/wiki/Rounding#Round_half_away_from_zero)**
    (or **ties to away**) – rounds to the nearest value; if the number
    falls midway, it is rounded to the nearest value above (for positive
    numbers) or below (for negative numbers).[^2]

- Directed roundings

  - **Round toward 0** – directed rounding towards zero (also known as
    *truncation*).[^3]

  - **Round toward +∞** – directed rounding towards positive infinity
    (also known as *rounding up* or *ceiling*).[^4]

  - **Round toward −∞** – directed rounding towards negative infinity
    (also known as *rounding down* or *floor*).[^5]

If in non-negative domain, $round(\cdot)$ can be one of the following 3
forms:

- $$
  \begin{equation}\label{round_1}\tag{3}
  \forall x \in \mathbb{R^+}\cup\{0\},~round_1(x)=\begin{cases}
                    \lfloor x\rfloor, \text{if }x-\lfloor x\rfloor<0.5 \\
                    \lceil x\rceil, \text{if }x-\lfloor x\rfloor \geq 0.5
                    \end{cases}
  \end{equation}
  $$ In this form, if fix $n$, we have $f_1(r,n,N)$’s range
  $R(f_1)=\{x|-\frac{n}{2}<x\leq\frac{n}{2},x\in \mathbb{Z}\}$. See
  [appendix A.1](#A.1) for analysis process.

- $$
  \begin{equation}\label{round_2}\tag{4}
  \forall x \in \mathbb{R^+}\cup\{0\},~round_2(x)=\begin{cases}
                   \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor \leq 0.5 \\
                   \lceil x\rceil,\text{if }x-\lfloor x\rfloor > 0.5
                   \end{cases}
  \end{equation}
  $$ In this form, if fix $n$, we have $f_2(r,n,N)$’s range
  $R(f_2)=\{x|-\frac{n}{2}\leq x<\frac{n}{2},x\in \mathbb{Z}\}$. See
  [appendix A.2](#A.2) for analysis process.

- $$
  \begin{equation}\label{round_3}\tag{5}
  \forall x \in \mathbb{R^+}\cup\{0\},~round_3(x)=\begin{cases}
                    \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor<0.5 \\
                    \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor=0.5,\lfloor x\rfloor \mod 2=0\\
                    \lceil x\rceil,\text{if }x-\lfloor x\rfloor=0.5,\lceil x\rceil\mod 2= 0\\
                    \lceil x\rceil,\text{if }x-\lfloor x\rfloor>0.5
                    \end{cases}
  \end{equation}
  $$

  In this form, if fix $n$, we have $f_3(r,n,N)$’s range
  $R(f_3)=\{x|-\frac{n}{2}\leq x\leq\frac{n}{2},x\in \mathbb{Z}\}$. See
  [appendix A.3](#A.3) for analysis process.

{% note primary %}

So, any $round(\cdot)$ function will result in a maximum difference of
about $0.5n$ in $\sum_{i=1}^{n}y_i$ to $N$. If back to original dividing
problem, there will be a difference up to $0.5n$ in the total number of
elements in divided parts to original total number. That is to say, up
to $0.5n$ elements may be missed. So, we cannot just use $round(\cdot)$
function directly to divide elements in $L$.

{% endnote %}

And, combine [appendix A.1](#A.1),[appendix A.2](#A.2) and [appendix
A.3](#A.3), we can find the following about the function$\eqref{round}$:
$$
\begin{equation}\label{round_range}\tag{6}
\begin{aligned}
&\text{Acorrding to appendix A.1, A.2 and A.3, if fix $n$, then}\\
&~~~~\text{for all } i\in \{1,2,...,n\} \text{ there are } -0.5\leq round(r_iN)-r_iN \leq 0.5,\\
&~~~~\text{and} -0.5n\leq [\sum_{i=1}^n round(r_{i}N)]-N \leq 0.5n,\\
&\text{regardless of which concreate form from  [IEEE~754] that the round function takes.}
\end{aligned}
\end{equation}
$$

This conclusion $\eqref{round_range}$ is very important and useful for
further illustrations and proofs, even though it seems very simple.

## If exactly no overlapping and omission

Let’s back to the original NIP problem $\eqref{NIP_problem}$. Although
the previous section has shown that any $round(\cdot)$ function cannot
ensure non-overlapping and non-omission, but in some certain
circumstances, choose $y_i=round(r_{i}N)$ will exactly meet the
constraint $\sum_{i=1}^{n}y_i=N$, leading to no overlapping and no
omission. In this case, we can proof that, these $y=y^*_i=round(r_{i}N)$
that make up to $Y^*=[y^*_1,y^*_2,...,y^*_n]$ is a solution to the NIP
problem $\eqref{NIP_problem}$ . See [appendix A.4](#A.4) for the proof
procedures.

# Methods

In this section, we post 2 optional algorithms, with necessary proofs
and explanations of themself, to solve the NIP problem
$\eqref{NIP_problem}$.

## Solution 1, based on round() function

In the above sections, we can find that if $y_i=round(r_{i}N)$ meets the
constraint $\sum_{i=1}^{n}y_i=N$, it just become (one of) our expired
solution. So, we can express a method that based on $round(\cdot)$
function as:

- Directly use $round(\cdot)$ function and calculate
  $y=[round(r_{1}N),round(r_{2}N),...,round(r_{n}N)]$ at first.

- Try to find and apply a modifying bias vector
  $b=[b_1,b_2,...,b_n]\in \mathbb{Z^n}$ to $y$ to form the target
  $y^*=y+b$. So, the original NIP problem $\eqref{NIP_problem}$ can be
  rewrite as:

  $$
  \begin{equation}\label{NIP_problem_round}\tag{7}
  \begin{aligned}
    \text{known:}~~~~&n,N \in \mathbb{Z^+}, n \leq N\\
    &p\in \mathbb{R},~p\geq 1\\
    &r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1\\
    &m=N-\sum_{i=1}^n round(r_iN)\\
    \text{minimize:}~~~~&(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\\
    \text{subject to:}~~~~~&b = [b_1,b_2,...,b_n]\in \mathbb{Z^n}\\
    &[round(r_1N)+b_1,round(r_2N)+b_2,...,round(r_nN)+b_n]\in \mathbb{N^n}\\
    &\sum_{i=1}^n b_i=m\\
    \end{aligned}
  \end{equation}
  $$

- Then, we can found the solution as: $$
  \begin{equation}\label{solution_round}\tag{8}
  \begin{aligned}
    &\text{Define }x=[x_1,x_2,...,x_n],\forall i \in \{1,2,...,n\},x_i = round(r_iN)-r_iN.\\
    &\text{From conclusion \eqref{round_range}, for all }\\
    &~~~~i\in \{1,2,...,n\} \text{, there is } -0.5\leq round(r_iN)-r_iN \leq 0.5.\\
    &\text{Without loss of generality, let }-0.5\leq~x_1\leq x_2\leq ...\leq x_n \leq 0.5.\\
    &\text{Since }m=N-\sum_{i=1}^n round(r_iN),\text{and from conclusion \eqref{round_range}, there are }m \in \mathbb{Z},\text{and }-\frac{n}{2}\leq m\leq\frac{n}{2}.\\ 
    &~~~~(1)~\text{If }m>0, \text{then set }b=[b_1,b_2,...,b_n]=[1,1,...,1,0,0,...,0],\\
    &~~~~~~~~\text{whose the first $|m|$ elements are $ 1$ and the rest are $0$}.\\
    &~~~~(2)~\text{If }m=0, \text{then set }b=[b_1,b_2,...,b_n]=[0,0,...,0].\\
    &~~~~(3)~\text{If }m<0, \text{then set }b=[b_1,b_2,...,b_n]=[0,0,...,-1,-1,...,-1],\\
    &~~~~~~~~\text{whose the first $|m|$ elements are $-1$ and the rest are $0$}.\\
    &\text{In this way, the $b$ become one of the solution of problem \eqref{NIP_problem_round}}.
    \end{aligned}
  \end{equation}
  $$

  When active, a mapping of stable sorting (see [appendix A.9](#A.9)) is
  need to get the state $-0.5\leq~x_1\leq x_2\leq ...\leq x_n \leq 0.5$.
  To proof if this solution is fit problem $\eqref{NIP_problem_round}$ ,
  see [appendix A.6](#A.6). Apparently, this solution’s time complexity
  is $O(n^2)$, since the biggest overhead is `sorting` , and it also has
  determinism and non-ambiguity when problem
  $\eqref{NIP_problem_round}$’s solution is not unique. If back to
  problem $\eqref{NIP_problem}$, there is
  $y^*=[round(r_1N)+b_1,round(r_2N)+b_2,...,round(r_nN)+b_n]$ that
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
concreate form is not unique from [IEEE
754](https://en.wikipedia.org/wiki/IEEE_754), leading us to some
additional troubles in the proof process. Although we eventually
overcome these troubles, we still hope to find a function without
ambiguity, i.e., $floor(\cdot)$ function, and express a method that
based on this function as:

- Directly use $round(\cdot)$ function and calculate
  $y=[floor(r_{1}N),floor(r_{2}N),...,floor(r_{n}N)]$ at first.

- From [appendix A.7](#A.7), the domain and range analysis are as:

  $$
  \begin{equation}\label{floor_range}\tag{9}
  \begin{aligned}
    &\text{Define }f(r,n,N)=[\sum_{i=1}^n floor(r_{i}N)]-N,\\
    &~~~~\text{where }n,N \in \mathbb{Z^+}, n \leq N,\\
    &~~~~~~~~~~~~~~~r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1.\\
    &\text{Acorrding to appendix A.7, if fix $n$, then }\\
    &~~~~f(r,n,N)\text{'s range }R(f)=\{x|-n< x\leq 0,x\in \mathbb{Z}\},\\
    &~~~~\text{and for all } i\in \{1,2,...,n\}\\
    &~~~~\text{there are }-1< floor(r_iN)-r_iN \leq 0,\\
    &~~~~\text{and} -n< [\sum_{i=1}^n round(r_{i}N)]-N \leq 0.\\
    \end{aligned}
  \end{equation}
  $$

- Try to find and apply a modifying bias vector
  $b=[b_1,b_2,...,b_n]\in \mathbb{Z^n}$ to $y$ to form the target
  $y^*=y+b$. So, the original NIP problem $\eqref{NIP_problem}$ can be
  rewrite as:

  $$
  \begin{equation}\label{NIP_problem_floor}\tag{10}
  \begin{aligned}
    \text{known:}~~~~&n,N \in \mathbb{Z^+}, n \leq N\\
    &p\in \mathbb{R},~p\geq 1\\
    &r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1\\
    &m=N-\sum_{i=1}^n floor(r_iN)\\
    \text{minimize:}~~~~&(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\\
    \text{subject to:}~~~~&b = [b_1,b_2,...,b_n]\in \mathbb{Z^n}\\
    &[floor(r_1N)+b_1,floor(r_2N)+b_2,...,floor(r_nN)+b_n]\in \mathbb{N^n}\\
    &\sum_{i=1}^n b_i=m\\
    \end{aligned}
  \end{equation}
  $$

- Then, we can found the solution as:

  $$
  \begin{equation}\label{solution_floor}\tag{11}
  \begin{aligned}
    &\text{Define }x=[x_1,x_2,...,x_n],\forall i \in \{1,2,...,n\},x_i = floor(r_iN)-r_iN.\\
    &\text{From conclusion \eqref{floor_range}, there is}\\
    &~~~~-1< floor(r_iN)-r_iN \leq 0.\\
    &\text{Without loss of generality, let }-1<~x_1\leq x_2\leq ...\leq x_n \leq 0.\\
    &\text{Since }m=N-\sum_{i=1}^n floor(r_iN),\text{and also from conclusion \eqref{floor_range}, there are }m \in \mathbb{Z},\text{and }0\leq m<n.\\ 
    &~~~~(1)~\text{If }m>0, \text{then set }b=[b_1,b_2,...,b_n]=[1,1,...,1,0,0,...,0],\\
    &~~~~~~~~\text{whose the first $|m|$ elements are $ 1$ and the rest are $0$}.\\
    &~~~~(2)~\text{If }m=0, \text{then set }b=[b_1,b_2,...,b_n]=[0,0,...,0].\\
    &\text{In this way, the b become one of the solution of problem \eqref{NIP_problem_floor}}.
    \end{aligned}
  \end{equation}
  $$

  When active, a mapping of stable sorting (see [appendix A.9](#A.9)) is
  need to get the state $-1<~x_1\leq x_2\leq ...\leq x_n \leq 0$. To
  proof if this solution is fit problem $\eqref{NIP_problem_floor}$ ,
  see [appendix A.8](#A.8). Apparently, this solution’s time complexity
  is $O(n^2)$, since the biggest overhead is `sorting` , and it also has
  determinism and non-ambiguity when problem
  $\eqref{NIP_problem_floor}$’s solution is not unique. If back to
  problem $\eqref{NIP_problem}$, there is
  $y^*=[floor(r_1N)+b_1,floor(r_2N)+b_2,...,floor(r_nN)+b_n]$ that
  becomes one of the solution of problem $\eqref{NIP_problem}$.

## Compare solution 1 and solution 2

Since both solution 1 and solution 2 have been rigorously proven, for
further analysis, we only need to compare these two solutions in terms
of results instead of the terms of proof procedures. We should figure
out:

- Are solution 1 and solution 2 the same in results when back to the
  original NIP problem $\eqref{NIP_problem}$?
  - Although solution 1 and solution 2 are methods that give out one of
    all solutions respectively with determinism and non-ambiguity, when
    back to he original NIP problem $\eqref{NIP_problem}$ by $y^*=y+b$,
    are these 2 solutions from solution 1 and solution 2 mathematically
    equivalent?
  - From the procedures in [appendix A.10](#A.10), we have proofed that,
    when the used sorting algorithm is stable [appendix A.9](#A.9):
    - If the $round(\cdot)$ is as $\eqref{round_1}$ or
      $\eqref{round_2}$, the results from solution $1$ solution $2$ will
      be the same one.
    - If the $round(\cdot)$ is as $\eqref{round_3}$, there is no
      guarantee that the results from solution $1$ solution $2$ are
      mathematically equivalent.
- Which one is better? We cannot figure out it.
  - Both the results from solution 1 and solution 2 have solved the
    original NIP problem $\eqref{NIP_problem}$, and obviously these 2
    methods (solutions) make the final algorithms meet the defined
    partition **standard**. So, in terms of results, there is no good or
    bad on these 2 solutions. Additionally, the above content has
    proofed that the results from these 2 solutions are not always
    mathematically equivalent, which is to say, these two solutions have
    their own tendencies in terms of results, and both are reasonable
    and acceptable.
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

4.  From two different ideas, one of which is
    `based on round() function` and another of which is
    `based on floor() function`, we have respectively designed a
    feasible sub-algorithms (operations/solutions) for them, to get a
    deterministic, unambiguous but not necessarily unique solution to
    this NIP problem , attached with rigorous proofs.

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
  with **no omission**, **no overlapping**,
  **determinacy(reproducibility)**, **simplicity**, **precision** and
  **universality**. This method will be useful and exceptionally
  efficient when one is concerned about the determinism, non-omission
  and non- overlapping of a dataset partitioning. And the division
  metric based on `p-norm` is a reasonable indicator and with
  universality.

- If we want to realize random division, we should shuffle the original
  list first, which is not the key problem of this article.

- We have not carried out the idea `based on ceil() function`, since the
  sub-algorithms (operations/solutions) that `based on floor() function`
  is nearly identical to it, only the axis flipped.

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

## A.1

$$
\begin{aligned}
\text{Given }&round(x), \text{where} \forall x \in \mathbb{R^+}\cup\{0\},~round(x)=\begin{cases}
                \lfloor x\rfloor, \text{if }x-\lfloor x\rfloor<0.5 \\
                \lceil x\rceil, \text{if }x-\lfloor x\rfloor \geq 0.5
                \end{cases},\text{ as \eqref{round_1}.}\\
\text{Given }&f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N,\\
&\text{where }n,N \in \mathbb{Z^+}, n \leq N,and~r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1.\\ 
\text{Fix }n&,~\text{try to find range }R(f(r,n,N)).\\ 
\text{Obviously},&\sum_{i=1}^{n}r_iN=N,\text{ and for all } i \in \{1,2,...,n\},\\
&\text{there is }round(r_{i}N)=round(\lfloor r_{i}N \rfloor+r_{i}N-\lfloor r_{i}N \rfloor),\\
&\text{also because } 0\leq r_{i}N-\lfloor r_{i}N \rfloor <1,\\
&\text{therefore, there is } round(r_{i}N) = \lfloor r_{i}N\rfloor+round(r_{i}N-\lfloor r_{i}N\rfloor),\\
&\text{i.e. } [\sum_{i=1}^n round(r_{i}N)]-N=\sum_{i=1}^n [round(r_{i}N-\lfloor r_{i}N\rfloor)-(r_{i}N-\lfloor r_{i}N\rfloor)],\\
\text{Then, }&\text{ because } -0.5<round(x)-x\leq 0.5,\\
&\text{so } -0.5<round(r_{i}N-\lfloor r_{i}N\rfloor)-(r_{i}N-\lfloor r_{i}N\rfloor)\leq 0.5,\\
&\text{i.e. }-0.5n<\sum_{i=1}^nround(r_{i}N-\lfloor r_{i}N\rfloor)-(r_{i}N-\lfloor r_{i}N\rfloor) \leq 0.5n,\\
&\text{i.e. }-0.5n<f(r,n,N)\leq 0.5n.\\
\text{Define}&~a=[a_1,a_2,...,a_n]\in \mathbb{N^n},b=[b_1,b_2,...,b_n]\in \mathbb{R^n},\text{it can be proofed that},\\
&~\forall a,b,~a\in \mathbb{N^n}, b_i\in \mathbb{R^n},a+b\neq \theta,\text{and }\forall i \in \{1,2,...,n\},~0\leq b_i<1, \sum_{i=1}^{n}b_i\in \mathbb{N},\\
&\exists~N,r,\text{where }N\in \mathbb{Z^+}, N\geq n, r\in \mathbb{R+^n}, \|r\|_{1}=1,\\
&\text{that make }a_i =\lfloor r_{i}N\rfloor,~b_i= r_{i}N-\lfloor r_{i}N\rfloor.\\
&\text{(A easy procedure: get $N$ by $N=\sum_{i=1}^{n}a_i+b_i$, then get $r_i$ by $r_i=(a_i+b_i)/N$.)}\\
\text{So, if } &n=2k, k\in \mathbb{Z^+}, \text{there will be }b_i= r_{i}N-\lfloor r_{i}N\rfloor,\\
\text{then},~&\sum_{i=1}^nround(r_{i}N-\lfloor r_{i}N\rfloor)-(r_{i}N-\lfloor r_{i}N\rfloor) =\sum_{i=1}^{2k}round(b_i)-(b_i).\\
~~\text{If }&~b = [0.5,0.5,...,0.5],\sum_{i=1}^{2k}b_i = k,~\text{then }\sum_{i=1}^{2k}round(b_i)-(b_i)=0.5*2k=k.\\
~~\text{If }&~b = [0,0,0.5,...,0.5],\sum_{i=1}^{2k}b_i = k-1,~\text{then }\sum_{i=1}^{2k}round(b_i)-(b_i)=0.5*2(k-1)=k-1.\\
&...\\
~~\text{If }&~b = [0,0,...,0],\sum_{i=1}^{2k}b_i = 0,~\text{then }\sum_{i=1}^{2k}round(b_i)-(b_i)=0.\\
&\text{Define }\Delta \rightarrow 0^+.\\
~~\text{If }&~b = [2(k-1)*\Delta,0,0.5-\Delta...,0.5-\Delta],\sum_{i=1}^{2k}b_i = k-1,\\
&\text{then }\sum_{i=1}^{2k}round(b_i)-(b_i)=-2(k-1)*\Delta-(0.5-\Delta)*2(k-1)=-(k-1).\\
~~\text{If }&~b = [2(k-2)*\Delta,0,0,0,0.5-\Delta...,0.5-\Delta],\sum_{i=1}^{2k}b_i = k-2,\\
&\text{then }\sum_{i=1}^{2k}round(b_i)-(b_i)=-2(k-2)*\Delta-(0.5-\Delta)*2(k-2)=-(k-2).\\
&...\\
~~\text{If }&~b = [2\Delta,0,...,0,0.5-\Delta,0.5-\Delta],\sum_{i=1}^{2k}b_i = 1,\\
&\text{then }\sum_{i=1}^{2k}round(b_i)-(b_i)=-2\Delta-(0.5-\Delta)*2=-1.\\
&\text{Therefore, there is }\{-k+1,-k+2,...,-1,0,1,...,k\}\subseteq R(f(r,n,N)),\\
&\text{i.e., }\{x|-\frac{n}{2}<x\leq\frac{n}{2},x\in \mathbb{Z}\}\subseteq R(f(r,n,N)).\\
&\text{Also, because }-0.5n<f(r,n,N)\leq 0.5n,~\text{and }f(r,n,N)\in \mathbb{Z},\\
&\text{therefore, there is } R(f(r,n,N))=\{x|-\frac{n}{2}<x\leq\frac{n}{2},x\in \mathbb{Z}\}.\\
\text{And, if}&~n=2k-1,k\in \mathbb{Z^+},\text{there will be }b_i= r_{i}N-\lfloor r_{i}N\rfloor,\\
\text{then},~&\sum_{i=1}^nround(r_{i}N-\lfloor r_{i}N\rfloor)-(r_{i}N-\lfloor r_{i}N\rfloor) =\sum_{i=1}^{2k-1}round(b_i)-(b_i).\\
~~\text{If }&~b = [0,0.5,0.5,...,0.5],\sum_{i=1}^{2k-1}b_i = k-1,~\text{then }\sum_{i=1}^{2k-1}round(b_i)-(b_i)=0.5*2(k-1)=k-1.\\
~~\text{If }&~b = [0,0,0,0.5,...,0.5],\sum_{i=1}^{2k-1}b_i = k-2,~\text{then }\sum_{i=1}^{2k-1}round(b_i)-(b_i)=0.5*2(k-2)=k-2.\\
&...\\
~~\text{If }&~b = [0,0,...,0],\sum_{i=1}^{2k-1}b_i = 0,~\text{then }\sum_{i=1}^{2k-1}round(b_i)-(b_i)=0.\\
&\text{Define }\Delta \rightarrow 0^+.\\
~~\text{If }&~b = [2(k-1)*\Delta,0.5-\Delta...,0.5-\Delta],\sum_{i=1}^{2k-1}b_i = k-1,\\
&\text{then }\sum_{i=1}^{2k-1}round(b_i)-(b_i)=-2(k-1)*\Delta-(0.5-\Delta)*2(k-1)=-(k-1).\\
~~\text{If }&~b = [2(k-2)*\Delta,0,0,0.5-\Delta...,0.5-\Delta],\sum_{i=1}^{2k-1}b_i = k-2,\\
&\text{then }\sum_{i=1}^{2k-1}round(b_i)-(b_i)=-2(k-2)*\Delta-(0.5-\Delta)*2(k-2)=-(k-2).\\
&...\\
~~\text{If }&~b = [2\Delta,0,...,0,0.5-\Delta,0.5-\Delta],\sum_{i=1}^{2k-1}b_i = 1,\\
&\text{then }\sum_{i=1}^{2k-1}round(b_i)-(b_i)=-2\Delta-(0.5-\Delta)*2=-1.\\
&\text{Therefore, there is }\{-k+1,-k+2,...,-1,0,1,...,k-1\}\subseteq R(f(r,n,N)),\\
&\text{i.e., }\{x|-\frac{n}{2}<x\leq\frac{n}{2},x\in \mathbb{Z}\}\subseteq R(f(r,n,N)).\\
&\text{Also, because }-0.5n<f(r,n,N)\leq 0.5n,~\text{and }f(r,n,N)\in \mathbb{Z},\\
&\text{therefore, there is } R(f(r,n,N))=\{x|-\frac{n}{2}<x\leq\frac{n}{2},x\in \mathbb{Z}\}.\\
\text{Summarize }&\text{the above:}\\
&\text{If fix }n,~\text{then }R(f(r,n,N))=\{x|-\frac{n}{2}<x\leq\frac{n}{2},x\in \mathbb{Z}\}.\\
\end{aligned}
$$

## A.2

$$
\begin{aligned}
\text{Given }&round(x), \text{where} \forall x \in \mathbb{R^+}\cup\{0\},~round(x)=\begin{cases}
                \lfloor x\rfloor, \text{if }x-\lfloor x\rfloor \leq 0.5 \\
                \lceil x\rceil, \text{if }x-\lfloor x\rfloor > 0.5
                \end{cases},\text{ as \eqref{round_2}.}\\
\text{Given }&f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N,\\
&~\text{where }n,N \in \mathbb{Z^+}, n \leq N,\text{and }r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1.\\
\text{Fix }n&,\text{try to find range }R(f(r,n,N)).~\text{The same to appendix A.1, we can get: }\\
&\text{If fix }n,~\text{then }R(f(r,n,N))=\{x|-\frac{n}{2}\leq x<\frac{n}{2},x\in \mathbb{Z}\}.\\
\end{aligned}
$$

## A.3

$$
\begin{aligned}
\text{Given }&round(x), \text{where }\forall x \in \mathbb{R^+}\cup\{0\},round(x)=\begin{cases}
                \lfloor x\rfloor, &\text{if }&x-\lfloor x\rfloor<0.5 \\
                \lfloor x\rfloor,&\text{if }&x-\lfloor x\rfloor=0.5,\lfloor x\rfloor \mod 2=0\\
                \lceil x\rceil, &\text{if }&x-\lfloor x\rfloor=0.5,\lceil x\rceil\mod 2= 0\\
                \lceil x\rceil, &\text{if }&x-\lfloor x\rfloor>0.5
                \end{cases},\text{ as \eqref{round_3}.}\\
\text{Given }&f(r,n,N)=[\sum_{i=1}^n round(r_{i}N)]-N,\\
&~\text{where }n,N \in \mathbb{Z^+}, n \leq N,and~r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1.\\
\text{Fix }n&,~\text{try to find range }R(f(r,n,N)).\\ 
\text{Obviously},&\sum_{i}^{n}r_iN=N,\\ 
&\text{also because for all } x \in \mathbb{R} \text{ there is }-0.5\leq round(x)-x\leq 0.5,\\
&\text{therefore} -0.5n\leq [\sum_{i=1}^n round(r_{i}N)]-N=\sum_{i=1}^n round(r_{i}N)-r_iN \leq 0.5n,\\
&\text{i.e., }-0.5n<f(r,n,N)\leq 0.5n.\\
\text{Define}&~a=[a_1,a_2,...,a_n]\in \mathbb{N^n},b=[b_1,b_2,...,b_n]\in \mathbb{R^n},\text{it can be proofed that},\\
&~\forall a,b,~a\in \mathbb{N}, b_i\in \mathbb{R}, a+b\neq \theta, and~\forall i \in \{1,2,...,n\},~0\leq b_i<1, \sum_{i=1}^{n}b_i\in \mathbb{N},\\
&\exists~N,r,\text{where }N\in \mathbb{Z^+}, N\geq n, r\in \mathbb{R+^n}, \|r\|_{1}=1,\\
&\text{that make }a_i =\lfloor r_{i}N\rfloor,~b_i= r_{i}N-\lfloor r_{i}N\rfloor.\\
&\text{(A easy procedure: get $N$ by $N=\sum_{i=1}^{n}a_i+b_i$, then get $r_i$ by $r_i=(a_i+b_i)/N$.)}\\
\text{So, if }&n=2k, k\in \mathbb{Z^+},~\text{there will be }a_i=\lfloor r_{i}N\rfloor,b_i= r_{i}N-\lfloor r_{i}N\rfloor,\\
\text{then},~&\sum_{i=1}^n round(r_{i}N)-r_{i}N =\sum_{i=1}^{2k}round(a_i+b_i)-(a_i+b_i).\\
\text{And},~&\text{difine }t\in \mathbb{Z^+}.\\
~~\text{If }&~a=[2t-1,2t-1,...,2t-1],b=[0.5,0.5,...,0.5],\sum_{i=1}^{2k}b_i = k,\\
&\text{then }\sum_{i=1}^{2k}round(a_i+b_i)-(a_i+b_i)=0.5*2k=k.\\
~~\text{If }&~a=[2t,2t-1,2t-1,...,2t-1],b=[0.5,0.5,...,0.5],\sum_{i=1}^{2k}b_i = k,\\
&\text{then }\sum_{i=1}^{2k}round(a_i+b_i)-(a_i+b_i)=-0.5*1+0.5*(2k-1)=k-1.\\
&...\\
~~\text{If }&~a=[2t,2t,...,2t],b=[0.5,0.5,...,0.5],\sum_{i=1}^{2k}b_i = k,\\
&\text{then }\sum_{i=1}^{2k}round(a_i+b_i)-(a_i+b_i)=-0.5*2k+0.5*(2k-2k)=-k.\\
&\text{Therefore, there is } \{-k,-k+1,...,-1,0,1,...,k\}\subseteq R(f(r,n,N)),\\
&\text{i.e., }\{x|-\frac{n}{2}\leq x\leq\frac{n}{2},x\in \mathbb{Z}\}\subseteq R(f(r,n,N)).\\
&\text{Also, because } -0.5n\leq f(r,n,N)\leq 0.5n,~\text{and }f(r,n,N)\in \mathbb{Z},\\
&\text{therefore, there is } R(f(r,n,N))=\{x|-\frac{n}{2}\leq x\leq\frac{n}{2},x\in \mathbb{Z}\}.\\
\text{And, if}&~n=2k-1, k\in \mathbb{Z^+},\text{there will be }a_i=\lfloor r_{i}N\rfloor,b_i= r_{i}N-\lfloor r_{i}N\rfloor,\\
\text{then},~&\sum_{i=1}^n round(r_{i}N)-r_{i}N =\sum_{i=1}^{2k-1}round(a_i+b_i)-(a_i+b_i).\\
\text{And},~&\text{difine }t\in \mathbb{Z^+},s\in \mathbb{Z^+}.\\
~~\text{If }&~a=[s,2t-1,2t-1,...,2t-1],b=[0,0.5,0.5,...,0.5],\sum_{i=1}^{2k-1}b_i = k,\\
&\text{then }\sum_{i=1}^{2k-1}round(a_i+b_i)-(a_i+b_i)=0-0.5*0+0.5*(2k-2)=k-1.\\
~~\text{If }&~a=[s,2t,2t-1,2t-1,...,2t-1],b=[0,0.5,0.5,...,0.5],\sum_{i=1}^{2k-1}b_i = k,\\
&\text{then }\sum_{i=1}^{2k-1}round(a_i+b_i)-(a_i+b_i)=0-0.5*1+0.5*(2k-3)=k-1.\\
&...\\
~~\text{If }&~a=[s,2t,2t,...,2t],b=[0,0.5,0.5,...,0.5],\sum_{i=1}^{2k-1}b_i = k,\\
&\text{then }\sum_{i=1}^{2k-1}round(a_i+b_i)-(a_i+b_i)=0-0.5*(2k-2)=-(k-1).\\
&\text{Therefore, there is }\{-k+1,-k+2,...,-1,0,1,...,k-1\}\subseteq R(f(r,n,N)),\\
&\text{i.e.},~\{x|-\frac{n}{2}\leq x\leq\frac{n}{2},x\in \mathbb{Z}\}\subseteq R(f(r,n,N)).\\
&\text{Also, because } -0.5n\leq f(r,n,N)\leq 0.5n,~and~f(r,n,N)\in \mathbb{Z},\\
&\text{therefore, there is } R(f(r,n,N))=\{x|-\frac{n}{2}\leq x\leq\frac{n}{2},x\in \mathbb{Z}\}.\\
\text{Summarize }&\text{the above:}\\
&\text{If fix }n,~\text{then }R(f(r,n,N))=\{x|-\frac{n}{2}\leq x\leq\frac{n}{2},x\in \mathbb{Z}\}.\\
\end{aligned}
$$

## A.4

$$
\begin{aligned}
\text{Known: }&n,N \in \mathbb{Z^+}, n \leq N\\
&p\in \mathbb{R},~p\geq 1\\
&r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1\\
\text{Minimize: }&(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}\\
\text{Subject to: }&~y = [y_1,y_2,...,y_n]\in \mathbb{N^n}\\
&\sum_{i=1}^{n}y_i=N\\
\text{Define solutions set: }&Y^*=\{y|y=\mathop{\arg\min}\limits_{y\in \mathbb{N^n},\|y\|_1=N}(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}\}\\
\text{Try to proof: }&\text{If }y^*=[round(r_{1}N),round(r_{2}N),...,round(r_{n}N)],and~\sum_{i=1}^{n}round(r_{i}N)=N,\\
&\text{then }y^*\in Y^*.\\
\text{Proof:}&\\
&\text{Since }y^*\in Y^*,\\
&\text{assume }\exists~y\neq y^*,y\in \mathbb{N},\sum_{i=1}^{n}y_i=N,\text{that make }(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}<(\sum_{i=1}^n |y^*_i-r_{i}N |^{p})^{\frac{1}{p}}.\\
&\text{Also because } p\geq 1,p\in \mathbb{R},\\
&\text{therefore, there is } (\sum_{i=1}^n |y_i-r_{i}N |^{p})<(\sum_{i=1}^n |y^*_i-r_{i}N |^{p}).\\
&\text{Define }f:\{\mathbb{Z^+},\mathbb{Z^-}\cup\mathbb{Z^+}\}\rightarrow \mathbb{Z^n},\\
&~~~~\forall i,v~~i\in\mathbb{Z^+},i\leq n, v\in \mathbb{Z^-}\cup\mathbb{Z^+},\\
&~~~~f(i,v)=[0,0,...,0,v,0...,0]\in \mathbb{N},\\
&~~~~\text{represents a vector whose the i-th element is $v$ and other elements are all }0.\\
&\text{So, rewrite $y$ by $y^*$ as: }\\
&~~~~y = y^*+f(i_1,v_1)+f(i_2,v_2)+...+f(i_k,v_k),\\
&~~~~\text{where }k \in \mathbb{Z^+}~1\leq i_1<i_2<...<i_k\leq n,\\
&~~~~\text{and }\forall k \in \mathbb{Z^+}~v_k\in \mathbb{Z^-}\cup\mathbb{Z^+}.\\
&\text{Without loss of generality, let }i_1=1,i_2=2,...,i_k=k\leq n,\\
&\text{so, for all } i \in \{1,2,...,k\},\text{ there is }y_i=y^*_i+v_i, \text{ and for all } i \in \{k+1,k+2,...,n\},\text{ there is }y_i=y^*_i,\\
(I)\rightarrow &\text{ therefore } (\sum_{i=1}^k |y^*_i+v_i-r_{i}N |^{p})<(\sum_{i=1}^k |y^*_i-r_{i}N |^{p}).\\
&\text{Also, because for all }i \in \{1,2,...,k\},\text{ there is }|y^*_i+v_i-r_{i}N|-|y^*_i-r_{i}N|=|round(r_{i}N)+v_i-r_{i}N|-|round(r_{i}N)-r_{i}N|,\\
&\text{and from conclusion} \eqref{round_range},\\
&~~~~\text{there must be} -0.5\leq round(r_{i}N)-r_{i}N\leq 0.5,\\
&\text{and also because } v_i\leq -1~or~v_i\geq 1,\\
&\text{therefore } |round(r_{i}N)+v_i-r_{i}N|\geq 0.5,\\
&\text{so } |y_i-r_{i}N |^{p}-|y^*_i-r_{i}N |^{p} = |y^*_i+v_i-r_{i}N|-|y^*_i-r_{i}N|\geq 0,\\
&\text{i.e., } (\sum_{i=1}^k |y^*_i+v_i-r_{i}N |^{p})\geq(\sum_{i=1}^k |y^*_i-r_{i}N |^{p}), \text{which is contradictory to }(I).\\
&\text{So, the above assumption is not valid, i.e.,}\\
&\text{for all } y\neq y^*,~\text{there are }(\sum_{i=1}^n |y_i-r_{i}N |^{p})^{\frac{1}{p}}\geq (\sum_{i=1}^n |y^*_i-r_{i}N |^{p})^{\frac{1}{p}},\\
&\text{therefore, this $y^*$ satisfies $y^*\in Y^*$. }\\
& Q.E.D.\\
\end{aligned}
$$

## Lemma 1

$$
\begin{equation}\label{lemma_1}\tag{12}
\begin{aligned}
\text{Lemma:}\\
&\text{Given set }V_1,V_2,~\text{that }\emptyset \subsetneq V_1 \subseteq V_2,\\
&~~~~\text{and given set }U\subset V_2, \complement_{V_2}U.\\
&\text{If there is:}\\
&~~\text{Assume }U \cap V_1 \neq \emptyset,\\
&~~\text{it can be proofed that }U \cap V_1 \neq \emptyset \Rightarrow \complement_{V_2}U \cap V_1 \neq \emptyset.\\
&\text{Then:}\\
&~~\complement_{V_2}U \cap V_1 \neq \emptyset.\\
\text{Proof:}\\
&\text{If assumption }U \cap V_1 \neq \emptyset \text{ is valid},\\
&~~\text{then}, U \cap V_1 \neq \emptyset \Rightarrow \complement_{V_2}U \cap V_1 \neq \emptyset~\text{leads to }\complement_{V_2}U \cap V_1 \neq \emptyset.\\
&\text{If assumption }U \cap V_1 \neq \emptyset \text{ is not valid},\\
&~~\text{then}, U \cap V_1=\emptyset,\text{also leads to }\complement_{V_2}U \cap V_1 \neq \emptyset.\\
\end{aligned}
\end{equation}
$$

## Lemma 2

$$
\begin{equation}\label{lemma_2}\tag{13}
\begin{aligned}
\text{Lemma: }&\\
&\text{Given set }V_1,V_2,~\text{that }V_1 \subseteq V_2 \subseteq \mathbb{R^n},\\
&~~~~\text{where }V_1=\{x|\mathop{\arg\min}\limits_{x\in V_2}f(x)\}\neq \emptyset,\\
&~~~~\text{and given set }U\subset V_2.\\
&\text{If: }U \cap V_1 \neq \emptyset.\\
&\text{Then: }\emptyset \neq \{x|\mathop{\arg\min}\limits_{x\in U}f(x)\}\subset V_1.\\
\text{Proof: }&\text{Omitted}\\
&\\
\end{aligned}
\end{equation}
$$

## Lemma 3

$$
\begin{equation}\label{lemma_3}\tag{14}
\begin{aligned}
\text{Lemma: }&\\
&\text{Given set }V_1,V_2,~\text{that }\emptyset~\neq V_1,V_1\subseteq V_2 \subseteq \mathbb{R^n},\\
&~~~~\text{and given set }V^{*}_{1}=\{x|\mathop{\arg\min}\limits_{x\in V_1}f(x)\},\\
&~~~~\text{and given set }V^{*}_{2}=\{x|\mathop{\arg\min}\limits_{x\in V_2}f(x)\}.\\
&\text{If: }\exists x \in V^{*}_{2}, \text{and }x \in V_1.\\
&\text{Then: }x \in V^{*}_{1} \subseteq V^{*}_{2}.\\
\text{Proof: }&~\text{Omitted}\\
\end{aligned}
\end{equation}
$$

## A.5

$$
\begin{equation}\label{function_i}\tag{15}
\begin{aligned}
&\text{Define a helper function and elaboration some features (conclusions) of it.}\\
&\forall p\geq 1,~x \in [-0.5,0.5],~k\in \mathbb{N},\\
&~~~~I(k,x) =\begin{cases}
                |k+x|^{p}-|k+x-1|^{p},~k\geq 1, k \in \mathbb{Z},~x \in [-0.5,0.5]\\
                0,~k=0,~x \in [-0.5,0.5]\\
                |k+x|^{p}-|k+x+1|^{p},k\leq -1, k \in \mathbb{Z},~x \in [-0.5,0.5]
                \end{cases}.\\
&\text{Since when }k\geq2,k \in \mathbb{Z},~x \in [-0.5,0.5],p\geq 1,\\
&~~~~\text{there is }\frac{\partial[(k+x)^{p}-(k+x-1)^{p}]}{\partial x}=p(k+x)^{p-1}-p(k+x-1)^{p-1}\geq 0,\\
&\text{and, when }k=1,k \in \mathbb{Z},~x \in [0,0.5],p\geq 1,\\
&~~~~\text{there is }\frac{\partial[(1+x)^{p}-(x)^{p}]}{\partial x}=p(1+x)^{p-1}-p(x)^{p-1}\geq 0,\\
&\text{and, when }k=1,k \in \mathbb{Z},~x \in [-0.5,0],p\geq 1,\\
&~~~~\text{there is }\frac{\partial[(1+x)^{p}-(-x)^{p}]}{\partial x}=p(1+x)^{p-1}+p(-x)^{p-1}\geq 0.\\
&\text{So, when }k\geq1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\geq 1,\\
&~~~~\text{the function }(|k+x|^{p}-|k+x-1|^{p})\text{is monotonically increasing W.R.T. x. }\\
&\text{So for all } x_1,x_2\in [-0.5,0.5],\\
&\text{when }k\geq2,\text{there is}\\
&~~~~I(k,x_1)-I(k-1,x_2)=|k+x_1|^{p}-|k+x_1-1|^{p}-(|k-1+x_2|^{p}-|k+x_2-2|^{p})\\
&~~~~\geq \min_{x_1}(|k+x_1|^{p}-|k+x_1-1|^{p})-\max_{x_2}(|k-1+x_2|^{p}-|k+x_2-2|^{p})\\
&~~~~= (|k-0.5|^{p}-|k-1.5|^{p})-(|k-0.5|^{p}-|k-1.5|^{p})=0,\\
&\text{and when }k=1,\text{there is}\\
&~~~~I(k,x_1)-I(k-1,x_2)=|1+x_1|^{p}-|x_1|^{p}-0\geq |1-0.5|^{p}-|-0.5|^{p}=0.\\
\\
&\text{Similarly, we can obtain:}\\
&\text{when }k\leq -1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\geq 1,\\
&~~~~\text{the function }(|k+x|^{p}-|k+x+1|^{p})\text{is monotonically decreasing W.R.T. x. }\\
&\text{So for all } x_1,x_2\in [-0.5,0.5],\\
&\text{when }k\leq-2,\text{there is}\\
&~~~~I(k,x_1)-I(k+1,x_2)\geq 0,\\
&\text{and when }k=-1,\text{there is}\\
&~~~~I(k,x_1)-I(k+1,x_2)=|-1+x_1|^{p}-|x_1|^{p}-0=|-x_1+1|^{p}-|-x_1|^{p}\geq 0.\\
\\
&\text{To conclude:}\\
&(1)\text{In the circumstance that }k \in \mathbb{Z},p\geq 1,\\
&~~~~\forall x_1,x_2,...,x_{\infty}\in [-0.5,0.5], \text{there are,}\\
&~~~~~~~~0=I(0,x_1)\leq I(-1,x_1)\leq I(-2,x_2)\leq...\leq I(-k_{\infty},x_{\infty}),\\
&~~~~~~~~\text{and }0=I(0,x_1)\leq I(1,x_1)\leq I(2,x_2)\leq...\leq I(k_{\infty},x_{\infty})\\
&(2)\text{In the circumstance that }k\geq 1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\geq 1,\\
&~~~~\text{the function }I(k,x)~\text{is monotonically increasing W.R.T. x. }\\
&(3)\text{In the circumstance that }k\leq-1,k \in \mathbb{Z},~x \in [-0.5,0.5],p\geq 1,\\
&~~~~\text{the function }I(k,x)~\text{is monotonically decreasing W.R.T. x. }\\
\end{aligned}
\end{equation}
$$

## A.6

The proof procedure of solution 1 that based on `round()` function. For
better readability, we divide the proof process into several parts. The
first one is a pre-explanation, followed by assumptions and
extrapolations step by step, until the conclusion is reached.

1.  Preliminary illustrations:

    $$
    \begin{aligned}
     &\text{Basing on \eqref{NIP_problem_round} and \eqref{solution_round}, try to proof the correctness of \eqref{solution_round}}\\
     &\text{Known conditions:}\\
     &~~~~n,N \in \mathbb{Z^+}, n \leq N\\
     &~~~~p\in \mathbb{R},~p\geq 1\\
     &~~~~r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1\\
     &~~~~m=N-\sum_{i=1}^n round(r_iN)\\
     &~~~~m \in \mathbb{Z},\text{and }-\frac{n}{2}\leq m\leq\frac{n}{2} (\text{according to conclusioin~\eqref{round_range}})\\
     &\text{Define }x=[x_1,x_2,...,x_n], \forall i \in \{1,2,...,n\},x_i = round(r_iN)-r_iN,\\
     &~~~~\text{also from conclusion }\eqref{round_range}, \text{there is }-0.5\leq round(r_iN)-r_iN \leq 0.5.\\
     &\text{Without loss of generality, let }-0.5\leq x_1\leq x_2\leq ...\leq x_n \leq 0.5.\\
     &\text{Define }B_f=\{b|b=[b_1,b_2,...,b_n]\in \mathbb{Z^n},\sum_{i=1}^n b_i=m,[round(r_1N)+b_1,round(r_2N)+b_2,...,round(r_nN)+b_n]\in \mathbb{N^n}\}.\\
     &\text{Define }B^{'}_f=\{b|b=[b_1,b_2,...,b_n]\in \mathbb{Z^n},\sum_{i=1}^n b_i=m\}.\\
     &\text{Define solutions set }B^{*}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B_f}(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}.\\
     &\text{Define solutions set }B^{*'}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B^{'}_f}(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}.\\
     &\text{If }m\geq 0, \text{then }\exists b=[m,0,...,0]\in \mathbb{Z^n},\sum_{i=1}^n b_i=m,\\
     &~~~~\text{that make }[round(r_1N)+b_1,round(r_2N)+b_2,...,round(r_nN)+b_n]\in \mathbb{N^n},\\
     &~~~~\text{and if }m< 0,\\
     &~~~~\text{because }-\frac{n}{2}\leq N-\sum_{i=1}^n round(r_iN)\leq\frac{n}{2},\\
     &~~~~\text{so, } \sum_{i=1}^n round(r_iN)-\frac{n}{2}\leq N\leq\frac{n}{2}+\sum_{i=1}^n round(r_iN),\\
     &~~~~\text{therefore, }  \sum_{i=1}^n round(r_iN)\geq N-\frac{n}{2}\geq n-\frac{n}{2}=\frac{n}{2}\geq |m|,\\
     &~~~~\text{so, } \text{accordding to specific }round(r_iN)~\forall i \in \{1,2,...,n\},\text{there still }\exists b \in \mathbb{Z^n},\sum_{i=1}^n b_i=m.\\
     &~~~~\text{that make }[round(r_1N)+b_1,round(r_2N)+b_2,...,round(r_nN)+b_n]\in \mathbb{N^n},\text{i.e., } \exists b\in B_f,\\
     &\text{Therefore, there is } \emptyset \neq B_f.\\
     &\text{So, there are }B_f\subseteq B^{'}_f, \emptyset \neq B^{*}_f\subseteq B_f,~\emptyset\neq B^{*'}_f \subseteq B^{'}_f.\\
     \end{aligned}
    $$

2.  Assumption 1:

    $$
    \begin{aligned}
     &\text{Assume that,}\exists b=[b_1,b_2,...,b_n]\in B^{*'}_f \subseteq B^{'}_f,\\
     &~~~~\text{and simultaneously }b\in B_1= \{b|b=[b_1,b_2,...,b_n] \in \mathbb{Z^n},~\sum_{i=1}^n b_i = m, \exists s,t, b_s\geq 1,b_t\leq -1\}\subseteq B^{'}_f.\\
     &\text{Without loss of generality, let }s<t.\\
     &\text{So,there is }b=[...,b_s,...,b_t,...] \in B^{*'}_f \cap B_1.\\
     &\text{Define }b^{'}=[...,b^{'}_s,...,b^{'}_t,...]=[...,b_s-1,...,b_t+1,...]\in B^{'}_f, \text{i.e.},~b^{'}_s=b_s-1,b^{'}_t=b_t+1,\\
     &\text{therefore, there is } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|round(r_sN)+b^{'}_s-r_{s}N |^{p}+|round(r_tN)+b^{'}_t-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|round(r_sN)+b_s-1-r_{s}N |^{p}+|round(r_tN)+b_t+1-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5, there is,}\\
     &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(b_s,round(r_sN)-r_{s}N)-I(b_t,round(r_tN)-r_{t}N)\\
     &\leq -I(0,round(r_sN)-r_{s}N)-I(0,round(r_tN)-r_{t}N)\\
     &=0+0=0,\\
     &\text{so, } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}\leq \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{i.e., } (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\leq (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{so, } b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in B_1~\text{or }b^{'}\in\complement_{B^{'}_{f}}{B_1}.\text{If }b^{'}\in B_1,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure,and then get }b^{''}.\\
     &~~~~~~~~~~~\text{Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_{f}}{B_1},\text{i.e.},~\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \neq \emptyset.\\
     &\text{Then, according to lemma $1$ \eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_f}B_1 \cap B^{*'}_f \neq \emptyset.\\
     \end{aligned}
    $$

3.  Assumption 2:

    $$
    \begin{aligned}
     &\text{Assume that,}\exists b=[b_1,b_2,...,b_n]\in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \subseteq B^{'}_f,\\
     &~~~~\text{and simultaneously }b\in B_2= \{b|b=[b_1,b_2,...,b_n],~ b_i \in \mathbb{Z},~\sum_{i=1}^n b_i = m, \exists s,~b_s\geq 2~or~\exists s,~b_s\leq -2\}\subseteq B^{'}_f.\\
     &\text{Since }b \in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2,\\
     &\text{if }\exists~s,b_s\geq 2,then~\forall i \in \{1,2,...,n\},\text{there is }b_{i}\geq 0,\\
     &\text{and according to~\eqref{round_range},there is }0\leq \sum_{i=1}^n b_i \leq \frac{n}{2},\\
     &\text{therefore, }\exists t\neq s,\text{that }b_t=0.\\
     &\text{Without loss of generality, let }s<t.\\
     &\text{So,there is }b=[...,b_s,...,b_t,...] \in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2.\\
     &\text{Define }b^{'}=[...,b^{'}_s,...,b^{'}_t,...]=[...,b_s-1,...,b_t+1,...]\in \complement_{B^{'}_f}B_1, \text{i.e.},~b^{'}_s=b_s-1,b^{'}_t=b_t+1=0,\\
     &\text{therefore, } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|round(r_sN)+b^{'}_s-r_{s}N |^{p}+|round(r_tN)+b^{'}_t-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|round(r_sN)+b_s-1-r_{s}N |^{p}+|round(r_tN)+1-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(b_s,round(r_sN)-r_{s}N)+I(1,round(r_tN)-r_{t}N)\\
     &=-[I(b_s,round(r_sN)-r_{s}N)-I(1,round(r_tN)-r_{t}N)]\\
     &\leq0.\\
     &\text{Similarly, we can obtain,}\\
     &\text{If }\exists~s,b_s\leq -2,\text{then for all } i \in \{1,2,...,n\},\text{there is }b_{i}\leq 0,\\
     &\text{therefore, }\exists t\neq s,\text{that }b_t=0.\\
     &\text{Without loss of generality, let }s<t.\\
     &\text{So,there is }b=[...,b_s,...,b_t,...] \in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2.\\
     &\text{Define }b^{'}=[...,b^{'}_s,...,b^{'}_t,...]=[...,b_s+1,...,b_t-1,...]\in \complement_{B^{'}_f}B_1,\text{i.e.},~b^{'}_s=b_s+1,b^{'}_t=b_t-1=-1,\\
     &\text{therefore, } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|round(r_sN)+b^{'}_s-r_{s}N |^{p}+|round(r_tN)+b^{'}_t-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|round(r_sN)+b_s+1-r_{s}N |^{p}+|round(r_tN)-1-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(b_s,round(r_sN)-r_{s}N)+I(-1,round(r_tN)-r_{t}N)\\
     &=-[I(b_s,round(r_sN)-r_{s}N)-I(-1,round(r_tN)-r_{t}N)]\\
     &\leq0.\\
     &\text{So, regardless of whether }\exists~s,b_s \geq2~\text{or }\exists~s,b_s \leq -2,\\
     &~~~~\text{there is }\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}\leq \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{so, } (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\leq (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{therefore, } b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in \complement_{B^{'}_f}B_1\cap B_2~\text{or }b^{'}\in\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}. \text{If }b^{'}\in \complement_{B^{'}_f}B_1\cap B_2,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure}\\
     &~~~~~~~~~~~\text{and then get }b^{''}.\text{Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2},\text{i.e.},~\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \neq \emptyset.\\
     &\text{Then, according to lemma $1$\eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \neq \emptyset.\\
     \end{aligned}
    $$

4.  Assumption 3:

    $$
    \begin{aligned}
     &\text{Assume that,} \exists b=[b_1,b_2,...,b_n]\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f\subseteq B^{'}_{f},\text{and simultaneously}\\
     &~~~~b\in B_3= \{b|b=[b_1,b_2,...,b_n],~ b_i \in \mathbb{Z},~\sum_{i=1}^n b_i = m, \exists s,t,~0\leq b_s<b_t,x_s<x_t~or~\exists s,t,b_s<b_t\leq 0,x_s<x_t\}\subseteq B^{'}_{f},\\
     &\text{and because} -0.5\leq x_1\leq x_2\leq ...\leq x_n \leq 0.5,\\
     &\text{so, there must be }s<t.\\
     &\text{Since }b \in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_3,\\
     &\text{if }\exists~0\leq b_s<b_t,x_s<x_t,then~\forall i \in \{1,2,...,n\},\text{there is }b_{i}\in \{0,1\},\\
     &\text{therefore, }b_s=0, b_t = 1.\\
     &\text{So, there is } b=[...,b_s,...,b_t,...] \in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_3.\\
     &\text{Define }b^{'}=[...,b^{'}_s,...,b^{'}_t,...]=[...,b_s+1,...,b_t-1,...]\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1,\text{i.e.},~b^{'}_s=b_s+1=1,b^{'}_t=b_t-1=0,\\
     &\text{therefore, } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|round(r_sN)+b^{'}_s-r_{s}N |^{p}+|round(r_tN)+b^{'}_t-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|round(r_sN)+1-r_{s}N |^{p}+|round(r_tN)-r_{t}N |^{p}-|round(r_sN)-r_{s}N |^{p}-|round(r_tN)+1-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=I(1,round(r_sN)-r_{s}N)-I(1,round(r_tN)-r_{t}N)\\
     &=I(1,x_s)-I(1,x_t)\\
     &\leq 0, \text{since }x_s<x_t.\\
     &\text{Similarly, we can obtain,}\\
     &\text{if }\exists~0\leq b_s<b_t,x_s<x_t,\text{then }\forall i \in \{1,2,...,n\},\text{there is }b_{i}\in \{0,-1\},\\
     &\text{so, }b_s=-1, b_t = 0.\\
     &\text{So, there is }b=[...,b_s,...,b_t,...] \in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_3.\\
     &\text{Define }b^{'}=[...,b^{'}_s,...,b^{'}_t,...]=[...,b_s+1,...,b_t-1,...]\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1,\text{i.e.},~b^{'}_s=b_s+1=0,b^{'}_t=b_t-1=-1,\\
     &\text{therefore, } \sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=|round(r_sN)+b^{'}_s-r_{s}N |^{p}+|round(r_tN)+b^{'}_t-r_{t}N |^{p}-|round(r_sN)+b_s-r_{s}N |^{p}-|round(r_tN)+b_t-r_{t}N |^{p}\\
     &=|round(r_sN)-r_{s}N |^{p}+|round(r_tN)-1-r_{t}N |^{p}-|round(r_sN)-1-r_{s}N |^{p}-|round(r_tN)-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(-1,round(r_sN)-r_{s}N)+I(-1,round(r_tN)-r_{t}N)\\
     &=-I(-1,x_s)+I(-1,x_t)\\
     &\leq 0, \text{since }x_s<x_t.\\
     &\text{So, regardless of whether }\exists~0\leq b_s<b_t,x_s<x_t~or~\exists~0\leq b_s<b_t,x_s<x_t,\\
     &~~~~\text{there is }\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}\leq \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{so, } (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\leq (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{therefore, } b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap B_3~\text{or }b^{'}\in\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3}.\\
     &~~~~~~~~~~~\text{If }b^{'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap B_3,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure}\\
     &~~~~~~~~~~~\text{and then get }b^{''}.\text{Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3},\text{i.e.},~\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3}\cap B^{*'}_f \neq \emptyset.\\
     &\text{Then, according to lemma $1$ \eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_f}B_2\cap\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \neq \emptyset.\\
     \end{aligned}
    $$

5.  Consider a special $b$

    $$
    \begin{aligned}
     &\text{Define: }B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1.\\
     &\text{Konwn: }x = [x_1,x_2,...,x_n], x_i = round(r_iN)-r_iN,-0.5\leq x_1\leq x_2\leq ...\leq x_n \leq 0.5.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n round(r_iN), \text{and from conclusion }\eqref{round_range}, \text{there are }m \in \mathbb{Z},\text{and }-\frac{n}{2}\leq m\leq\frac{n}{2}.\\ 
     &~~~~(1)~\text{If }m>0, \text{then let }b=[b_1,b_2,...,b_n]=[1,1,...,1,0,0,...,0],\\
     &~~~~~~~~\text{whose the first $|m|$ elements are $ 1$ and the rest are $0$}.\\
     &~~~~(2)~\text{If }m=0, \text{then let }b=[b_1,b_2,...,b_n]=[0,0,...,0].\\
     &~~~~(3)~\text{If }m<0, \text{then let }b=[b_1,b_2,...,b_n]=[0,0,...,-1,-1,...,-1],\\
     &~~~~~~~~\text{whose the last $|m|$ elements are $-1$ and the rest are $0$}.\\
     &\text{Obviously},~b\in B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1.\\
     \end{aligned}
    $$

6.  Assumption 4 that proof the above $b\in B^{*'}_{f}$:

    $$
    \begin{aligned}
     &\text{Assume that,}\exists b^{'}=[b^{'}_1,b^{'}_2,...,b^{'}_n]\in B_t=\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1, b^{'}\neq b,\\
     &~~~~\text{that make} (\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}<(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}.\\
     &\text{Define }f:\{\mathbb{Z^+},\mathbb{Z^-}\cup\mathbb{Z^+}\}\rightarrow \mathbb{Z^n},\\
     &~~~~\forall i,v~~i\in\mathbb{Z^+},i\leq n, v\in \mathbb{Z^-}\cup\mathbb{Z^+},\\
     &~~~~f(i,v)=[0,0,...,0,v,0...,0]\in \mathbb{N},\\
     &~~~~\text{represents a vector whose the i-th element is $v$ and other elements are all }0.\\
     \text{If }&m>0,\\
     &\text{because }p\geq 1,p\in \mathbb{R},\\
     &\text{therefore }(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})<(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}),\\
     &\text{and because }m>0,\\
     &\text{so }b = [1,1,...,1,0,0,...,0],\\
     &~~~~\text{whose the first $|m|$ elements are $1$ and the rest are }0.\\
     &\text{Without loss of generality, let}\\
     &~~~~b^{'} = b+f(s_1,-1)+f(s_2,-1)+...+f(s_k,-1)+f(t_1,1)+f(t_2,1)+...+f(t_k,1),\\
     &~~~~\text{where }k \in \mathbb{Z^+}~1\leq s_1<s_2<...<s_k\leq m<t_1<t_2<...<t_k\leq n,\\
     &~~~~\text{and }\forall i\in \{1,2,...,k\}~s_i,t_i \in \mathbb{Z},\\
     &\text{therefore for all }i\in \{1,2,...,k\},\text{there are }b_{s_i}=1,b_{t_i}=0,b^{'}_{s_i}=b_{s_i}-1=0,b^{'}_{t_i}=b_{t_i}+1=1,\\
     &\text{so, }(\sum_{i=1}^k |round(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p})\\
     &~~~~<(\sum_{i=1}^k |round(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p}),\\
     (I)\rightarrow &\text{therefore}(\sum_{i=1}^k |round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)+1-r_{t_i}N |^{p})\\
     &~~~~~~~~<(\sum_{i=1}^k |round(r_{s_i}N)+1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p}),\\
     &\text{and because for all }i\in \{1,2,...,k\},\\
     & |round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)+1-r_{t_i}N |^{p}-|round(r_{s_i}N)+1-r_{s_i}N |^{p}-|round(r_{t_i}N)-r_{t_i}N |^{p}\\
     &=-I(1,round(r_{s_i}N)-r_{s_i}N)+I(1,round(r_{t_i}N)-r_{t_i}N)\\
     &=-I(1,x_{s_i})+I(1,x_{t_i})\\
     &\geq 0,\text{since }b\in \complement_{B^{'}_{f}}{B_3},b_{s_i}>b_{t_i}, x_{s_i}\leq x_{t_i},\\
     &\text{therefore }(\sum_{i=1}^k |round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)+1-r_{t_i}N |^{p})\\
     &~~~~~~~~\geq (\sum_{i=1}^k |round(r_{s_i}N)+1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p}),\\
     &\text{which is contradictory to (I), so the above assumption is not valid.}\\
     \text{If }&m=0:\\
     &\text{Obviously}, B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1~\text{is a single-element set, there is }\nexists b^{'}\neq b, \text{that }b^{'}\in B_t,\\
     &\text{so the above assumption is not valid.}\\
     \text{If }&m<0:\\
     &\text{because }p\geq 1,p\in \mathbb{R},\\
     &\text{so }(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})<(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p}),\\
     &b = [0,0,...,-1,-1,...,-1],\\
     &~~~~\text{whose the last $|m|$ elements are $-1$, the rest are }0.\\
     &\text{Without loss of generality, let},\\
     &~~~~b^{'} = b+f(s_1,-1)+f(s_2,-1)+...+f(s_k,-1)+f(t_1,1)+f(t_2,1)+...+f(t_k,1),\\
     &~~~~\text{where }k \in \mathbb{Z^+}~1\leq s_1<s_2<...<s_k<n-|m|+1\leq t_1<t_2<...<t_k\leq n,\\
     &~~~~\text{and }\forall i\in \{1,2,...,k\}~s_i,t_i \in \mathbb{Z},\\
     &\text{therefore for all }i\in \{1,2,...,k\},\text{there are }b_{s_i}=0,b_{t_i}=-1,b^{'}_{s_i}=b_{s_i}-1=-1,b^{'}_{t_i}=b_{t_i}+1=0,\\
     &\text{so } (\sum_{i=1}^k |round(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p})\\
     &~~~~<(\sum_{i=1}^k |round(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|round(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p}),\\
     (II)\rightarrow &\text{therefore} (\sum_{i=1}^k |round(r_{s_i}N)-1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p})\\
     &~~~~~~~~<(\sum_{i=1}^k |round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)-1-r_{t_i}N |^{p}),\\
     &\text{and because for all }i\in \{1,2,...,k\}, \text{there is }\\
     &|round(r_{s_i}N)-1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p}-|round(r_{s_i}N)-r_{s_i}N |^{p}-|round(r_{t_i}N)-1-r_{t_i}N |^{p}\\
     &=I(-1,round(r_{s_i}N)-r_{s_i}N)-I(-1,round(r_{t_i}N)-r_{t_i}N)\\
     &=I(-1,x_{s_i})-I(-1,x_{t_i})\\
     &\geq 0,\text{since }b\in \complement_{B^{'}_{f}}{B_3},b_{s_i}>b_{t_i}, x_{s_i}\leq x_{t_i},\\
     &\text{therefore }(\sum_{i=1}^k |round(r_{s_i}N)-r_{s_i}N |^{p}+|round(r_{t_i}N)+1-r_{t_i}N |^{p})\\
     &~~~~\geq (\sum_{i=1}^k |round(r_{s_i}N)+1-r_{s_i}N |^{p}+|round(r_{t_i}N)-r_{t_i}N |^{p}),\\
     &\text{which is contradictory to (II), so the above assumption is not valid.}\\
     \text{So},&~\text{regardless of the value of $m$, the above assumption is always not valid, i.e.,}\\
     &\text{there must be}\\
     &b\in \{b|b=\mathop{\arg\min}\limits_{b\in B_t}(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\},\\
     &\text{also because } B_t \cap B^{*'}_f \neq \emptyset \text{ and } B_t \subseteq B^{'}_f,\\
     &\text{and according to \eqref{lemma_2}, there must be}\\
     &\emptyset \neq \{b|b=\mathop{\arg\min}\limits_{b\in B_t}(\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\} \subseteq B^{*'}_f,\\
     &\text{therefore }b\in B^{*'}_f.
     \end{aligned}
    $$

7.  Consider if the specific $b$ satisfies that
    $b\in B_f \subseteq B^{'}_f$:

    $$
    \begin{aligned}
     &\text{Konwn: }x = [x_1,x_2,...,x_n], x_i = round(r_iN)-r_iN,-0.5\leq x_1\leq x_2\leq ...\leq x_n \leq 0.5.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n round(r_iN), \text{and from conclusion }\eqref{round_range}, \text{there are }m \in \mathbb{Z},\text{and }-\frac{n}{2}\leq m\leq\frac{n}{2}.\\ 
     &\text{Try to proof the above $b$ satisfies that $b\in B_f \subseteq B^{'}_f$, i.e.,}\\
     &~~~~\text{try to proof the above $b$ satisfies }[round(r_1N)+b_1,round(r_2N)+b_2,...,round(r_nN)+b_n]\in \mathbb{N^n}\\
     &(1)\text{If }m>0, \text{then }b=[b_1,b_2,...,b_n]=[1,1,...,1,0,0,...,0],\\
     &~~~~\text{whose the first $|m|$ elements are $1$ and the rest are }0,\\
     &~~~~\text{then the constraint }[round(r_1N)+b_1,round(r_2N)+b_2,...,round(r_nN)+b_n]\in \mathbb{N^n }\text{is valid.}\\
     &(2)\text{If }m=0, \text{then }b=[b_1,b_2,...,b_n]=[0,0,...,0],\\
     &~~~~\text{then the constraint }[round(r_1N)+b_1,round(r_2N)+b_2,...,round(r_nN)+b_n]\in \mathbb{N^n }\text{is still valid.}\\
     &(3)\text{If }m<0, \text{then }b=[b_1,b_2,...,b_n]=[0,0,...,-1,-1,...,-1],\\
     &~~~~~~~~\text{whose the last $|m|$ elements are $-1$ and the rest are }0,\\
     &~~~~\text{and because }b\in \mathbb{Z^n},\sum_{i=1}^n b_i=m,\\
     &~~~~\text{so }m\in \mathbb{Z^-},\\
     &~~~~\text{also because }\sum_{i=1}^n x_i=-m,-0.5\leq x_1\leq x_2\leq ...\leq x_n \leq 0.5,\\
     &~~~~\text{therefore, }\text{there must be for all }i \in \{n-2|m|+1,n-2|m|+2,...,n\}~x_{i}\geq 0,\\
     &~~~~\text{i.e., there must be for all}i \in \{n-2|m|+1,n-2|m|+2,...,n\}~round(r_iN)\geq 1,\\
     &~~~~\text{so for all }i \in \{1,2,...,n-2|m|\}~round(r_iN)+b_i=round(r_iN)+0=round(r_iN),\\
     &~~~~~\text{and for all }i \in \{n-2|m|+1,n-2|m|+2,...,n-|m|\}~round(r_iN)+b_i=round(r_iN)+0=round(r_iN),\\
     &~~~~~\text{and for all }i \in \{n-|m|+1,n-|m|+2,...,n\}~round(r_iN)+b_i\geq 1-1 = 0,\\
     &~~~~\text{therefore, }\text{the constraint }[round(r_1N)+b_1,round(r_2N)+b_2,...,round(r_nN)+b_n]\in \mathbb{N^n}~\text{is still valid.}\\
     \text{So},&~\text{regardless of the value of }m~,\\
     &\text{the above $b$ always satisfies }[round(r_1N)+b_1,round(r_2N)+b_2,...,round(r_nN)+b_n]\in \mathbb{N^n},\text{i.e.},\\
     &\text{the above $b$ satisfies that }b\in B_f \subseteq B^{'}_f.\\
     \end{aligned}
    $$

8.  Finally

    $$
    \begin{aligned}
     &\text{Konwn: }x = [x_1,x_2,...,x_n], x_i = round(r_iN)-r_iN,-0.5\leq x_1\leq x_2\leq ...\leq x_n \leq 0.5.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n round(r_iN), \text{and from conclusion \eqref{round_range}, there are }m \in \mathbb{Z},\text{and }-\frac{n}{2}\leq m\leq\frac{n}{2}.\\ 
     &\text{Since the above vector $b$,i.e.,}\\
     &~~~~(1)~\text{if }m>0, \text{then }b=[b_1,b_2,...,b_n]=[1,1,...,1,0,0,...,0],\\
     &~~~~~~~~\text{whose the first $|m|$ elements are $ 1$ and the rest are }0,\\
     &~~~~(2)~\text{if }m=0, \text{then }b=[b_1,b_2,...,b_n]=[0,0,...,0],\\
     &~~~~(3)~\text{if }m<0, \text{then }b=[b_1,b_2,...,b_n]=[0,0,...,-1,-1,...,-1],\\
     &~~~~~~~~\text{whose the last $|m|$ elements are $-1$ and the rest are }0,\\
     &~~~~\text{that satisfies }b\in B^{*'}_f~\text{and }b\in B_f \subseteq B^{'}_f.\\
     &\text{Then, according to \eqref{lemma_3}, the final conclusion can be drawn as}\\
     &~~~~b\in B^{*}_f \subseteq B^{*'}_f.\\
     \end{aligned}
    $$

Along the above 8 points, the
[Solution-1](#Solution 1, based on round() function) is proofed totally.

## A.7

$$
\begin{aligned}
\text{Given }&floor(x), \text{where} \forall x \in \mathbb{R^+}\cup\{0\},~floor(x)=\lfloor x\rfloor.\\
\text{Given }&f(r,n,N)=[\sum_{i=1}^n floor(r_{i}N)]-N,\\
&~\text{where }n,N \in \mathbb{Z^+}, n \leq N,and~r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1.\\
\text{Fix }n,&\text{try to find range }R(f(r,n,N)).\\
\text{Obviously},&\sum_{i}^{n}r_iN=N,\\
&\text{therefore }[\sum_{i=1}^n floor(r_{i}N)]-N = \sum_{i=1}^n \lfloor r_{i}N\rfloor-r_{i}N.\\
&\text{also because } -1<floor(x)-x\leq 0,\\
&\text{so, } -1<\lfloor r_{i}N\rfloor-r_{i}N\leq 0,\\
&\text{therefore, }-n<\sum_{i=1}^n \lfloor r_{i}N\rfloor-r_{i}N \leq 0,\\
&\text{i.e., }-n<f(r,n,N)\leq 0.\\
\text{Define}&~a=[a_1,a_2,...,a_n]\in \mathbb{N^n},b=[b_1,b_2,...,b_n]\in \mathbb{R^n},\text{it can be proofed that,}\\
&~\forall a,b,~a\in \mathbb{N^n}, b_i\in \mathbb{R^n},a+b\neq \theta,\text{and }\forall i \in \{1,2,...,n\},~0\leq b_i<1, \sum_{i=1}^{n}b_i\in \mathbb{N},\\
&\exists~N,r,\text{where }N\in \mathbb{Z^+}, N\geq n, r\in \mathbb{R+^n}, \|r\|_{1}=1,\\
&\text{that make }a_i =\lfloor r_{i}N\rfloor,~b_i= r_{i}N-\lfloor r_{i}N\rfloor.\\
&\text{(A easy procedure: get $N$ by $N=\sum_{i=1}^{n}a_i+b_i$, then get $r_i$ by $r_i=(a_i+b_i)/N$).}\\
\text{So, if}&~\text{we have }b_i= r_{i}N-\lfloor r_{i}N\rfloor,\\
\text{then, }&\sum_{i=1}^n \lfloor r_{i}N\rfloor-r_{i}N =\sum_{i=1}^{n}(-b_i).\\
&\text{Define }\Delta \rightarrow 0^+.\\
~~\text{If }&~b = [1-\Delta,1-\Delta,...,1-\Delta,(n-1)*\Delta],\sum_{i=1}^{n}b_i = n-1,~\text{then }\sum_{i=1}^{n}(-b_i)=-n+1.\\
~~\text{If }&~b = [1-\Delta,1-\Delta,...,1-\Delta,0,(n-2)*\Delta],\sum_{i=1}^{n}b_i = n-2,~\text{then }\sum_{i=1}^{n}(-b_i)=-n+2.\\
&...\\
~~\text{If }&~b = [1-\Delta,0,...,0,\Delta],\sum_{i=1}^{n}b_i = 1,~\text{then }\sum_{i=1}^{n}(-b_i)=-1.\\
~~\text{If }&~b = [0,0,...,0,0],\sum_{i=1}^{n}b_i = 0,~\text{then }\sum_{i=1}^{n}(-b_i)=0.\\
&\text{Therefore, there is }\{-n+1,-n+2,...,-1,0\}\subseteq R(f(r,n,N)),\\
&\text{i.e.}\{x|-n<x\leq 0,x\in \mathbb{Z}\}\subseteq R(f(r,n,N)).\\
&\text{Also because } -n<f(r,n,N)\leq 0,~\text{and }f(r,n,N)\in \mathbb{Z},\\
&\text{therefore, there is }R(f(r,n,N))=\{x|-n<x\leq 0,x\in \mathbb{Z}\}.\\
\text{Summarize }&\text{the above:}\\
&\text{If }\text{fix }n,~\text{then }R(f(r,n,N))=\{x|-n<x\leq 0,x\in \mathbb{Z}\}.\\
\end{aligned}
$$

## A.8

The proof procedure of solution 2 that based on `floor()` function. For
better readability, we divide the proof process into several parts. The
first one is a pre-explanation, followed by assumptions and
extrapolations step by step, until the conclusion is reached.

1.  Preliminary illustrations:

    $$
    \begin{aligned}
     &\text{Basing on \eqref{NIP_problem_floor} and \eqref{solution_floor}, try to proof the correctness of \eqref{solution_floor}}.\\
     &\text{Known conditions:}\\
     &~~~~n,N \in \mathbb{Z^+}, n \leq N\\
     &~~~~p\in \mathbb{R},~p\geq 1\\
     &~~~~r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1\\
     &~~~~m=N-\sum_{i=1}^n floor(r_iN)\\
     &~~~~m \in \mathbb{Z},\text{and }0\leq m<n (\text{according to \eqref{floor_range}})\\
     &\text{Define }x=[x_1,x_2,...,x_n], \forall i \in \{1,2,...,n\},x_i = floor(r_iN)-r_iN.\\
     &\text{also from \eqref{floor_range}, there is }-n< floor(r_iN)-r_iN \leq 0.\\
     &\text{Without loss of generality, let }-n< x_1\leq x_2\leq ...\leq x_n \leq 0.\\
     &\text{Define }B_f=\{b|b=[b_1,b_2,...,b_n]\in \mathbb{Z^n},\sum_{i=1}^n b_i=m,[floor(r_1N)+b_1,floor(r_2N)+b_2,...,floor(r_nN)+b_n]\in \mathbb{N^n}\}.\\
     &\text{Define }B^{'}_f=\{b|b=[b_1,b_2,...,b_n]\in \mathbb{Z^n},\sum_{i=1}^n b_i=m\}.\\
     &\text{Define solutions set }B^{*}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B_f}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}.\\
     &\text{Define solutions set }B^{*'}_f=\{b|b=\mathop{\arg\min}\limits_{b\in B^{'}_f}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\}.\\
     &\text{If }m\geq 0, \text{then }\exists b=[m,0,...,0]\in \mathbb{Z^n},\sum_{i=1}^n b_i=m,\\
     &~~~~\text{and make }[floor(r_1N)+b_1,floor(r_2N)+b_2,...,floor(r_nN)+b_n]\in \mathbb{N^n},\\
     &\text{therefore } \exists b\in B_f,\\
     &\text{i.e., }\emptyset \neq B_f,\\
     &\text{therefore, there are }B_f\subseteq B^{'}_f, \emptyset \neq B^{*}_f\subseteq B_f,~\emptyset\neq B^{*'}_f \subseteq B^{'}_f.\\
     \end{aligned}
    $$

2.  Assumption 1

    $$
    \begin{aligned}
     &\text{Assume that,}\exists b=[b_1,b_2,...,b_n]\in B^{*'}_f \subseteq B^{'}_f,\\
     &~~~~\text{and simultaneously } b\in B_1= \{b|b=[b_1,b_2,...,b_n] \in \mathbb{Z^n},~\sum_{i=1}^n b_i = m, \exists s,t, b_s\geq 1,b_t\leq -1\}\subseteq B^{'}_f.\\
     &\text{Without loss of generality, let }s<t.\\
     &\text{So, there is } b=[...,b_s,...,b_t,...] \in B^{*'}_f \cap B_1.\\
     &\text{Define }b^{'}=[...,b^{'}_s,...,b^{'}_t,...]=[...,b_s-1,...,b_t+1,...]\in B^{'}_f,\text{i.e.},~b^{'}_s=b_s-1,b^{'}_t=b_t+1,\\
     &\text{therefore }\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|floor(r_sN)+b^{'}_s-r_{s}N |^{p}+|floor(r_tN)+b^{'}_t-r_{t}N |^{p}-|floor(r_sN)+b_s-r_{s}N |^{p}-|floor(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|floor(r_sN)+b_s-1-r_{s}N |^{p}+|floor(r_tN)+b_t+1-r_{t}N |^{p}-|floor(r_sN)+b_s-r_{s}N |^{p}-|floor(r_tN)+b_t-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(b_s,floor(r_sN)-r_{s}N)-I(b_t,floor(r_tN)-r_{t}N)\\
     &\leq -I(0,floor(r_sN)-r_{s}N)-I(0,floor(r_tN)-r_{t}N)\\
     &=0+0=0,\\
     &\text{therefore }\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}\leq \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{i.e. }(\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\leq (\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{so, }b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in B_1~\text{or }b^{'}\in\complement_{B^{'}_{f}}{B_1}.\text{If }b^{'}\in B_1,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure, and then get $b^{''}$.}\\
     &~~~~~~~~~~~\text{Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_{f}}{B_1},\text{i.e.},~\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \neq \emptyset.\\
     &\text{Then, according to lemma $1$ \eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_f}B_1 \cap B^{*'}_f \neq \emptyset.\\
     \end{aligned}
    $$

3.  Assumption 2

    $$
    \begin{aligned}
     &\text{Assume that:}\exists b=[b_1,b_2,...,b_n]\in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \subseteq B^{'}_f,\\
     &~~~~\text{and simultaneously } b\in B_2= \{b|b=[b_1,b_2,...,b_n],~ b_i \in \mathbb{Z},~\sum_{i=1}^n b_i = m, \exists s,~b_s\geq 2\}\subseteq B^{'}_f.\\
     &\text{Since }b \in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2,\\
     &\text{so }\exists~s,b_s\geq 2,\\
     &\text{therefore, for all }i \in \{1,2,...,n\},\text{there is }b_{i}\geq 0,\\
     &\text{and according to \eqref{floor_range}, there is }0\leq \sum_{i=1}^n b_i <n,\\
     &\text{therefore }\exists t\neq s,\text{that }b_t=0.\\
     &\text{Without loss of generality, let }s<t.\\
     &\text{So, there is } b=[...,b_s,...,b_t,...] \in \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_2.\\
     &\text{Define }b^{'}=[...,b^{'}_s,...,b^{'}_t,...]=[...,b_s-1,...,b_t+1,...]\in \complement_{B^{'}_f}B_1,\text{i.e., }b^{'}_s=b_s-1,b^{'}_t=b_t+1=1,\\
     &\text{so, } \sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|floor(r_sN)+b^{'}_s-r_{s}N |^{p}+|floor(r_tN)+b^{'}_t-r_{t}N |^{p}-|floor(r_sN)+b_s-r_{s}N |^{p}-|floor(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|floor(r_sN)+b_s-1-r_{s}N |^{p}+|floor(r_tN)+1-r_{t}N |^{p}-|floor(r_sN)+b_s-r_{s}N |^{p}-|floor(r_tN)-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &=-I(b_s,floor(r_sN)-r_{s}N)+I(1,floor(r_tN)-r_{t}N)\\
     &=-[I(b_s,floor(r_sN)-r_{s}N)-I(1,floor(r_tN)-r_{t}N)]\\
     &\leq0,\\
     &\text{therefore, there is } \sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}\leq \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{i.e., }(\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\leq (\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{so, } b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in \complement_{B^{'}_f}B_1\cap B_2~\text{or }b^{'}\in\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}. \text{If }b^{'}\in \complement_{B^{'}_f}B_1\cap B_2,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure}\\
     &~~~~~~~~~~~\text{and then get $b^{''}$.Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2},\text{i.e.},~\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \neq \emptyset.\\
     &\text{Then, according to lemma $1$ \eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_2}\cap B^{*'}_f \neq \emptyset.\\
     \end{aligned}
    $$

4.  Assumption 3

    $$
    \begin{aligned}
     &\text{Assume that:}\exists b=[b_1,b_2,...,b_n]\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f\subseteq B^{'}_{f},~\text{and simultaneously}\\
     &~~~~b\in B_3= \{b|b=[b_1,b_2,...,b_n],~ b_i \in \mathbb{Z},~\sum_{i=1}^n b_i = m, \exists s,t,~0\leq b_s<b_t,x_s<x_t\}\subseteq B^{'}_{f}.\\
     &\text{Because }-0.5\leq x_1\leq x_2\leq ...\leq x_n \leq 0.5,\\
     &\text{therefore, there must be }s<t.\\
     &\text{Since }b \in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_3,\\
     &\text{so }\exists~0\leq b_s<b_t,x_s<x_t,\\
     &\text{therefore, for all }i \in \{1,2,...,n\},\text{there is }b_{i}\in \{0,1\},\\
     &\text{hence, }b_s=0, b_t = 1.\\
     &\text{So,there is }b=[...,b_s,...,b_t,...] \in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1 \cap B^{*'}_f \cap B_3.\\
     &\text{Define }b^{'}=[...,b^{'}_s,...,b^{'}_t,...]=[...,b_s+1,...,b_t-1,...]\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1,\text{i.e.},~b^{'}_s=b_s+1=1,b^{'}_t=b_t-1=0,\\
     &\text{therefore }\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &~~~~=|floor(r_sN)+b^{'}_s-r_{s}N |^{p}+|floor(r_tN)+b^{'}_t-r_{t}N |^{p}-|floor(r_sN)+b_s-r_{s}N |^{p}-|floor(r_tN)+b_t-r_{t}N |^{p}\\
     &~~~~=|floor(r_sN)+1-r_{s}N |^{p}+|floor(r_tN)-r_{t}N |^{p}-|floor(r_sN)-r_{s}N |^{p}-|floor(r_tN)+1-r_{t}N |^{p}.\\
     &\text{According to helper functions and conclutions in \eqref{function_i} of appendix A.5},\\
     &\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p}- \sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}\\
     &=I(1,floor(r_sN)-r_{s}N)-I(1,floor(r_tN)-r_{t}N)\\
     &=I(1,x_s)-I(1,x_t)\\
     &\leq 0, \text{since }x_s<x_t,\\
     &\text{therefore, there is }\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p}\leq \sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p},\\
     &\text{i.e., }(\sum_{i=1}^n |round(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}\leq (\sum_{i=1}^n |round(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}},\\
     &\text{so, } b^{'}\in B^{*'}_f.\\
     &\text{N.B.:There is }b^{'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap B_3~\text{or }b^{'}\in\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3}.\\
     &~~~~~~~~~~~\text{If }b^{'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap B_3,\text{we use $b^{'}$ to replace $b$ and repeat the above procedure}\\
     &~~~~~~~~~~~\text{and then get $b^{''}$. Obviously, with a finite number of iterations, we must be able to find a }b^{'...'},\\
     &~~~~~~~~~~~\text{that }b^{'...'}\in \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3},\text{i.e.},~\complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1\cap\complement_{B^{'}_{f}}{B_3}\cap B^{*'}_f \neq \emptyset.\\
     &\text{Then, according to lemma $1$ \eqref{lemma_1}, whether the above assumption hold or not, there must be}\\
     &~~~~\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_f}B_2\cap\complement_{B^{'}_{f}}{B_1}\cap B^{*'}_f \neq \emptyset.\\
     \end{aligned}
    $$

5.  Consider a special $b$

    $$
    \begin{aligned}
     &\text{Define: }B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1.\\
     &\text{Konwn: }x = [x_1,x_2,...,x_n], x_i = floor(r_iN)-r_iN,-1< x_1\leq x_2\leq ...\leq x_n \leq 0.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n floor(r_iN), \text{and from conclusion \eqref{floor_range}, there are }m \in \mathbb{Z},\text{and }0\leq m<n.\\ 
     &~~~~(1)~\text{If }m>0, \text{then let }b=[b_1,b_2,...,b_n]=[1,1,...,1,0,0,...,0],\\
     &~~~~~~~~\text{whose the first $|m|$ elements are $1$, the rest are }0.\\
     &~~~~(2)~\text{If }m=0, \text{then let }b=[b_1,b_2,...,b_n]=[0,0,...,0].\\
     &\text{Obviously},~b\in B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1.\\
     \end{aligned}
    $$

6.  Assumption 4 that proof the above $b\in B^{*'}_{f}$:

    $$
    \begin{aligned}
     &\text{Assume that:}\exists b^{'}=[b^{'}_1,b^{'}_2,...,b^{'}_n]\in B_t=\complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1, b^{'}\neq b,\\
     &\text{that make} (\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p})^{\frac{1}{p}}<(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}.\\
     &\text{Define }f:\{\mathbb{Z^+},\mathbb{Z^-}\cup\mathbb{Z^+}\}\rightarrow \mathbb{Z^n}\\
     &~~~~\forall i,v~~i\in\mathbb{Z^+},i\leq n, v\in \mathbb{Z^-}\cup\mathbb{Z^+},\\
     &~~~~f(i,v)=[0,0,...,0,v,0...,0]\in \mathbb{N},\\
     &~~~~\text{represents a vector whose the i-th element is $v$ and other elements are all }0.\\
     \text{So, if }&m>0:\\
     &\text{because }p\geq 1,p\in \mathbb{R},\\
     &\text{therefore }(\sum_{i=1}^n |floor(r_iN)+b^{'}_i-r_{i}N |^{p})<(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p}),\\
     &\text{and because }m>0,\\
     &\text{hence }b = [1,1,...,1,0,0,...,0],\\
     &~~~~\text{whose the first $|m|$ elements are $1$, the rest are }0.\\
     &\text{Without loss of generality, let}\\
     &~~~~b^{'} = b+f(s_1,-1)+f(s_2,-1)+...+f(s_k,-1)+f(t_1,1)+f(t_2,1)+...+f(t_k,1),\\
     &~~~~\text{where }k \in \mathbb{Z^+}~1\leq s_1<s_2<...<s_k\leq m<t_1<t_2<...<t_k\leq n,\\
     &~~~~\text{and }\forall i\in \{1,2,...,k\}~s_i,t_i \in \mathbb{Z},\\
     &\text{therefore for all }i\in \{1,2,...,k\},\text{there are }b_{s_i}=1,b_{t_i}=0,b^{'}_{s_i}=b_{s_i}-1=0,b^{'}_{t_i}=b_{t_i}+1=1,\\
     &\text{so }(\sum_{i=1}^k |floor(r_{s_i}N)+b^{'}_{s_i}-r_{s_i}N |^{p}+|floor(r_{t_i}N)+b^{'}_{t_i}-r_{t_i}N |^{p})\\
     &~~~~<(\sum_{i=1}^k |floor(r_{s_i}N)+b_{s_i}-r_{s_i}N |^{p}+|floor(r_{t_i}N)+b_{t_i}-r_{t_i}N |^{p}),\\
     (I)\rightarrow &\text{ therefore }(\sum_{i=1}^k |floor(r_{s_i}N)-r_{s_i}N |^{p}+|floor(r_{t_i}N)+1-r_{t_i}N |^{p})\\
     &~~~~<(\sum_{i=1}^k |floor(r_{s_i}N)+1-r_{s_i}N |^{p}+|floor(r_{t_i}N)-r_{t_i}N |^{p}),\\
     &\text{and  because for all }i\in \{1,2,...,k\},\text{ there is}\\
     & |floor(r_{s_i}N)-r_{s_i}N |^{p}+|floor(r_{t_i}N)+1-r_{t_i}N |^{p}-|floor(r_{s_i}N)+1-r_{s_i}N |^{p}-|floor(r_{t_i}N)-r_{t_i}N |^{p}\\
     &=-I(1,floor(r_{s_i}N)-r_{s_i}N)+I(1,floor(r_{t_i}N)-r_{t_i}N)\\
     &=-I(1,x_{s_i})+I(1,x_{t_i})\\
     &\geq 0,since~b\in \complement_{B^{'}_{f}}{B_3},b_{s_i}>b_{t_i}, x_{s_i}\leq x_{t_i},\\
     &\text{therefore, }(\sum_{i=1}^k |floor(r_{s_i}N)-r_{s_i}N |^{p}+|floor(r_{t_i}N)+1-r_{t_i}N |^{p})\\
     &~~~~\geq (\sum_{i=1}^k |floor(r_{s_i}N)+1-r_{s_i}N |^{p}+|floor(r_{t_i}N)-r_{t_i}N |^{p}),\\
     &\text{which is contradictory to (I), so the above assumption is not valid.}\\
     \text{If }&m=0:\\
     &\text{Obviously}, B_t= \complement_{B^{'}_{f}}{B_3}\cap \complement_{B^{'}_{f}}{B_2}\cap \complement_{B^{'}_f}B_1~\text{is a single-element set, there is }\nexists b^{'}\neq b,\text{that }b^{'}\in B_t,\\
     &\text{so the above assumption is not valid.}\\
     \text{So},&~\text{regardless of the value of $m$, the above assumption is always not valid, i.e.,}\\
     &\text{there must be}\\
     &b\in \{b|b=\mathop{\arg\min}\limits_{b\in B_t}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\},\\
     &\text{and, because }B_t \cap B^{*'}_f \neq \emptyset, \text{and }B_t \subseteq B^{'}_f,\\
     &\text{and according to \eqref{lemma_2}, there must be}\\
     &\emptyset \neq \{b|b=\mathop{\arg\min}\limits_{b\in B_t}(\sum_{i=1}^n |floor(r_iN)+b_i-r_{i}N |^{p})^{\frac{1}{p}}\} \subseteq B^{*'}_f,\\
     &\text{therefore }b\in B^{*'}_f.\\
     \end{aligned}
    $$

7.  Consider if the specific $b$ satisfies that
    $b\in B_f \subseteq B^{'}_f$:

    $$
    \begin{aligned}
     &\text{Konwn: }x = [x_1,x_2,...,x_n], x_i = floor(r_iN)-r_iN,-1< x_1\leq x_2\leq ...\leq x_n \leq 0.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n floor(r_iN), \text{and from }\eqref{floor_range}, \text{there are }m \in \mathbb{Z},\text{and }0\leq m<0.\\ 
     &\text{Try to proof the above $b$ satisfies that $b\in B_f \subseteq B^{'}_f$, i.e.,}\\
     &~~~~\text{try to proof the above $b$ satisfies }[floor(r_1N)+b_1,floor(r_2N)+b_2,...,floor(r_nN)+b_n]\in \mathbb{N^n}.\\
     &(1)\text{If }m>0, \text{then }b=[b_1,b_2,...,b_n]=[1,1,...,1,0,0,...,0],\\
     &~~~~\text{whose the first $|m|$ elements are $1$ and the rest are }0,\\
     &~~~~\text{then the constraint }[floor(r_1N)+b_1,floor(r_2N)+b_2,...,floor(r_nN)+b_n]\in \mathbb{N^n }\text{is valid.}\\
     &(2)\text{If }m=0, \text{then }b=[b_1,b_2,...,b_n]=[0,0,...,0],\\
     &~~~~\text{then the constraint }[floor(r_1N)+b_1,floor(r_2N)+b_2,...,floor(r_nN)+b_n]\in \mathbb{N^n }\text{is still valid.}\\
     \text{So},&~\text{regardless of the value of }m,\\
     &\text{the above $b$ always satisfies }[floor(r_1N)+b_1,floor(r_2N)+b_2,...,floor(r_nN)+b_n]\in \mathbb{N^n},~\text{i.e.},\\
     &\text{the above $b$ satisfies that }b\in B_f \subseteq B^{'}_f.\\
     \end{aligned}
    $$

8.  Finally

    $$
    \begin{aligned}
     &\text{Konwn: }x = [x_1,x_2,...,x_n], x_i = floor(r_iN)-r_iN,-1< x_1\leq x_2\leq ...\leq x_n \leq 0.\\ 
     &\text{Konwn: }m=N-\sum_{i=1}^n floor(r_iN), \text{and from }\eqref{floor_range}, \text{there are }m \in \mathbb{Z},\text{and }0\leq m<0.\\ 
     &\text{Since the above vector $b$, i.e.,}\\
     &~~~~(1)~\text{if }m>0, \text{then }b=[b_1,b_2,...,b_n]=[1,1,...,1,0,0,...,0],\\
     &~~~~~~~~\text{whose the first $|m|$ elements are $1$, the rest are }0,\\
     &~~~~(2)~\text{if }m=0, \text{then }b=[b_1,b_2,...,b_n]=[0,0,...,0],\\
     &~~~~\text{that satisfies }b\in B^{*'}_f~\text{and }b\in B_f \subseteq B^{'}_f.\\
     &\text{Then, according to \ref{lemma_3}, the final conclusion can be drawn as}\\
     &~~~~b\in B^{*}_f \subseteq B^{*'}_f.\\
     \end{aligned}
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
  \begin{aligned}
    \text{Known:}~~~~&n,N \in \mathbb{Z^+}, n \leq N,\\
    &p\in \mathbb{R},~p\geq 1,\\
    &r = [r_1,r_2,...,r_n]\in \mathbb{R+^n},\|r\|_{1}=1.\\
    \text{Define:}&~I_s =\{1,2,...,s\},\\
    &I_{st}=\{s+1,s+2,...,t-2,t-1\},\\
    &I_{tn} =\{t,t+1,...,n-1,n\},\\
    &~~~~\text{where }s,t\in \mathbb{Z^+},1\leq s\leq t\leq n.\\
    &m^{'}=N-\sum_{i=1}^n floor(r_iN),\text{and from conclusion \eqref{floor_range}, there are }m^{'} \in \mathbb{Z},\text{and }0\leq m^{'}<n.\\
    &y^{'} \text{is the result $y$ from solution $1$.}\\
    &m^{''}=N-\sum_{i=1}^n round(r_iN),\text{and from conclusion \eqref{round_range}, there are }m^{''} \in \mathbb{Z},\text{and }-\frac{n}{2}\leq m^{''}\leq \frac{n}{2}.\\
    &y^{''} \text{is the result $y$ from solution $2$.}\\
    \text{Try to analyze:}&~\text{If $y^{'}$ is the same to $y^{''}$?}
    \end{aligned}
  $$

- Analyze the result of solution 2 first:

  $$
  \begin{aligned}
    &\text{From solution 2}:\\
    &~~~~\text{There is }x^{'}=[x^{'}_1,x^{'}_2,...,x^{'}_n],\forall i \in \{1,2,...,n\},x^{'}_i = floor(r_iN)-r_iN.\\
    &\text{Without loss of generality, let }\\
    &~~~~-1<x^{'}_1\leq x^{'}_2\leq ...\leq x^{'}_s< -0.5,\\
    &~~~~\forall i \in I_{st }x^{'}_i = -0.5,\\
    &~~~~-0.5<x^{'}_t\leq x^{'}_{t+1}...\leq x^{'}_n \leq 0.\\
    &\text{so }-1<x^{'}_1\leq x^{'}_2\leq ...\leq x^{'}_s< -0.5=x^{'}_{s+1}=x^{'}_{s+2}=...=x^{'}_{t-2}=x^{'}_{t-1}=-0.5<x^{'}_t\leq x^{'}_{t+1}...\leq x^{'}_n \leq 0.\\
    &\text{therefore }y^{'}=[floor(r_1N)+b^{'}_1,floor(r_2N)+b^{'}_2,...,floor(r_nN)+b^{'}_n],\\
    &~~~~\text{where}\\ 
    &~~~~~~~~(1)~\text{If }m^{'}>0, \text{then set }b^{'}=[b^{'}_1,b^{'}_2,...,b^{'}_n]=[1,1,...,1,0,0,...,0],\\
    &~~~~~~~~~~~~\text{whose the first $|m^{'}|$ elements are $ 1$ and the rest are $0$},\\
    &~~~~~~~~(2)~\text{If }m^{'}=0, \text{then set }b^{'}=[b^{'}_1,b^{'}_2,...,b^{'}_n]=[0,0,...,0].\\
    &\text{From solution 1}:\\
    &~~~~\text{There is }x^{''}=[x^{''}_1,x^{''}_2,...,x^{''}_n],\forall i \in \{1,2,...,n\},~x^{''}_i = round(r_iN)-r_iN.\\
    &\text{therefore }y^{''}=[round(r_1N)+b^{''}_1,round(r_2N)+b^{''}_2,...,round(r_nN)+b^{''}_n],\\
    &~~~~\text{where},\\ 
    &~~~~~~~~(1)~\text{If }m^{''}>0, \text{then set }b^{''}=[b^{''}_1,b^{''}_2,...,b^{''}_n]=[1,1,...,1,0,0,...,0],\\
    &~~~~~~~~~~~~\text{whose the first $|m^{''}|$ elements are $ 1$ and the rest are $0$},\\
    &~~~~~~~~(2)~\text{If }m^{''}=0, \text{then set }b^{''}=[b^{''}_1,b^{''}_2,...,b^{''}_n]=[0,0,...,0],\\
    &~~~~~~~~(3)~\text{If }m^{''}<0, \text{then set }b^{''}=[b^{''}_1,b^{''}_2,...,b^{''}_n]=[0,0,...,-1,-1,...,-1],\\
    &~~~~~~~~~~~~\text{whose the first $|m^{''}|$ elements are $-1$ and the rest are $0$}.
    \end{aligned}
  $$

- Then, analyze the result of solution 1 when $round(\cdot)$ is as
  $\eqref{round_1}$

  $$
  \begin{aligned}
    \text{(I)If}&~round(\cdot)~\text{is }\forall x \in \mathbb{R^+}\cup\{0\} round_1(x)=\begin{cases}
    \lfloor x\rfloor, \text{if }x-\lfloor x\rfloor<0.5 \\
    \lceil x\rceil, \text{if }x-\lfloor x\rfloor \geq 0.5
    \end{cases},\text{ as \eqref{round_1}},\\
    &\text{then }\forall i \in \{1,2,...,n\} x^{''}_i=round(r_iN)-r_iN =\begin{cases}
    floor(r_iN)-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor<0.5 \\
    floor(r_iN)+1-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor \geq 0.5
    \end{cases}\\
    &=\begin{cases}
            x^{'}_i, \text{if }x^{'}_i>-0.5 \\
            x^{'}_i+1, \text{if }x^{'}_i \leq -0.5
            \end{cases}.\\             
    &\text{So, according to $x^{'}$, there is}\\
    &\forall i \in I_s,-1<x^{'}_i<-0.5,x^{''}_i=x^{'}_i+1,\\
    &~~~~0<x^{''}_1=x^{'}_1+1\leq x^{''}_2=x^{'}_2+1\leq ... \leq x^{''}_s=x^{'}_s+1<0.5,\\
    &\forall i \in I_{tn},-0.5<x^{'}_i\leq 0,x^{''}_i=x^{'}_i,\\
    &~~~~-0.5< x^{''}_t=x^{'}_t\leq x^{''}_{t+1}=x^{'}_{t+1}...\leq x^{''}_n=x_n\leq 0,\\
    &\forall i \in I_{st},x^{'}_i=-0.5,x^{''}_i=x^{'}_i+1,\\
    &~~~~0.5=x^{''}_{s+1}=x^{'}_{s+1}+1=x^{''}_{s+2}=x^{'}_{s+2}+1=..=x^{''}_{t-2}=x^{'}_{t-2}+1=x^{''}_{t-1}=x^{'}_{t-1}+1.\\
    &\text{And, if a stable sorting algorithm (see appendix A.9) is applied, we can get}\\
    &~~~~-0.5< x^{''}_t\leq x^{''}_{t+1}...\leq x^{''}_n\leq 0<x^{''}_1\leq x^{''}_2\leq ...\leq x^{''}_s<x^{''}_{s+1}=x^{''}_{s+2}=...=x^{''}_{t-2}=x^{''}_{t-1}=0.5,\\
    &\text{therefore }m^{''}=N-\sum_{i=1}^n round(r_iN)=\sum_{i=1}^n[r_iN-round(r_iN)]=-\sum_{i=1}^n[x^{''}]=-[\sum_{i=1}^nx^{'}]-(t-1)=m^{'}-(t-1).\\
    &\text{If }m^{''}=m^{'}-(t-1)= 0,\\
    &\text{then }m^{'}= (t-1),\\
    &\text{so, } \forall i \in \{1,2,...,t-1\},b^{'}_i=1,\forall i \in \{t,t+1,...,n\},b^{'}_i=0,\\
    &\text{hence, }\forall i \in \{1,2,...,t-1\},y^{'}_i=floor(r_iN)+1,\forall i \in \{t,t+1,...,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,...,floor(r_{t-1}N)+1,floor(r_tN),floor(r_{t+1}N),...,floor(r_{n}N)].\\
    &\text{Because }m^{''}= 0,\\
    &\text{so, }\forall i \in \{1,2,...,n\},b^{''}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,...,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),...,round(r_nN)],\\
    &\text{hence, }\forall i \in I_s~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in I_{st }y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  I_{tn }y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0.\\
    &\text{If }m^{''}=m^{'}-(t-1)> 0,\\
    &\text{then }m^{'}> (t-1),\\
    &\text{so, }\forall i \in \{1,2,...,t-1,t,t+1,...,m^{'}\},b^{'}_i=1,\forall i \in \{m^{'}+1,m^{'}+2,...,n\},b^{'}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,...,t-1,t,t+1,...,m^{'}\},y^{'}_i=floor(r_iN)+1,\forall i \in \{m^{'}+1,m^{'}+2,...,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,...,floor(r_{t-1}N)+1,\\
    &~~~~floor(r_{t}N)+1,floor(r_{t+1}N)+1,...,floor(r_{m^{'}}N)+1,\\
    &~~~~floor(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),...,floor(r_{n}N)].\\
    &\text{Because }m^{''}> 0,\\
    &\text{so }\forall i \in \{t,t+1,...,t-1+m^{'}-(t-1)\},b^{''}_i=1,\forall i \in \{1,2,...,t-1,m^{'}+1,m^{'}+2...,n\},b^{''}_i=0,\\
    &\text{therefore }\forall i \in \{t,t+1,...,m^{'}\},y^{'}_i=round(r_iN)+1,\forall i \in \{1,2,...,t-1,m^{'}+1,m^{'}+2...,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),...,round(r_{t-1}N),\\
    &round(r_tN)+1,round(r_{t+1}N)+1,...,round(r_{m'}N)+1,\\
    &round(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),...,floor(r_{n}N)],\\
    &\text{hence }\forall i \in I_s~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in I_{st }y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{t,t+1,...,m^{'}\}~y^{''}_i-y^{'}_i=round(r_iN)+1-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN+1-(floor(r_iN)-r_iN+1)=x^{''}_i+1-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{m^{'}+1,m^{'}+2,...,n-1,n\}~y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0.\\
    &\text{If }m^{''}=m^{'}-(t-1)< 0,\\
    &\text{then }m^{'}< (t-1),\\
    &\text{so, }\forall i \in \{1,2,...,m^{'}\},b^{'}_i=1,\forall i \in \{m^{'}+1,m^{'}+2,...,t-1,t,...,n-1,n\},b^{'}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,...,m^{'}\},y^{'}_i=floor(r_iN)+1,\forall i \in \{m^{'}+1,m^{'}+2,...,t-1,t,...,n-1,n\},y^{'}_i=floor(r_iN)，\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,...,floor(r_{m^{'}}N)+1,\\
    &floor(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),...,floor(r_{t-1}N),floor(r_tN),...,floor(r_{n-1}N),floor(r_{n}N)].\\
    &\text{Because }m^{''}< 0,\\
    &\text{so, }\forall i \in \{t-1-[(t-1)-m^{'}]+1,t-1-[(t-1)-m^{'}]+2,...,t-1\},\\
    &~~~~b^{''}_i=-1,\forall i \in \{1,2,...,t-1-[(t-1)-m^{'}],t,t+1...,n\},b^{''}_i=0,\\
    &\text{therefore, }\forall i \in \{m^{'}+1,m^{'}+2,...,t-1\},y^{'}_i=round(r_iN)-1,\forall i \in \{1,2,...,m^{'},t,t+1,...,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),...,round(r_{m^{'}}N),\\
    &~~~~round(r_{m^{'}+1}N)-1,round(r_{m^{'}+2}N)-1,...,round(r_{t-1}N)-1,\\
    &~~~~round(r_{t}N),floor(r_{t+1}N),...,round(r_nN)],\\
    &\text{hence, }\forall i \in I_s \cup \{s+1,s+2,...,m^{'}\} ~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{m^{'}+1,m^{'}+2,...,t-1\}~y^{''}_i-y^{'}_i=round(r_iN)-1-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{t,t+1,...,n-1,n\}~y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0.\\
    &\text{So,regardless of any }m^{''}, \text{there always be }\forall i \in \{1,2,...,n\}, y^{''}_i-y^{'}_i=0,\\
    &\text{i.e. }y^{''}=y^{'}.
    \end{aligned}
  $$

- Then, analyze the result of solution 1 when $round(\cdot)$ is as
  $\eqref{round_2}$

  $$
  \begin{aligned}
    \text{(II)If}&~round(\cdot)~\text{is }\forall x \in \mathbb{R^+}\cup\{0\},~round_2(x)=  \begin{cases}
        \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor \leq 0.5 \\
        \lceil x\rceil,\text{if }x-\lfloor x\rfloor > 0.5
        \end{cases},\text{ as \eqref{round_2}},\\
    &\text{then }\forall i \in \{1,2,...,n\} x^{''}_i=round(r_iN)-r_iN =\begin{cases}
        floor(r_iN)-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor \leq 0.5 \\
        floor(r_iN)+1-r_iN, \text{if }r_iN-\lfloor r_iN\rfloor > 0.5
        \end{cases}\\
    &=\begin{cases}
            x^{'}_i, \text{if }x^{'}_i \geq -0.5 \\
            x^{'}_i+1, \text{if }x^{'}_i < -0.5
            \end{cases}.\\
    &\text{So, according to $x^{'}$, there is}\\
    &\forall i \in I_s,-1<x^{'}_i<-0.5,x^{''}_i=x^{'}_i+1,\\
    &~~~~0<x^{''}_1=x^{'}_1+1\leq x^{''}_2=x^{'}_2+1\leq ... \leq x^{''}_s=x^{'}_s+1<0.5,\\
    &\forall i \in I_{tn},-0.5<x^{'}_i\leq 0,x^{''}_i=x^{'}_i,\\
    &~~~~-0.5< x^{''}_t=x^{'}_t\leq x^{''}_{t+1}=x^{'}_{t+1}...\leq x^{''}_n=x_n\leq 0,\\
    &\forall i \in I_{st},x^{'}_i=-0.5,x^{''}_i=x^{'}_i,\\
    &~~~~-0.5=x^{''}_{s+1}=x^{'}_{s+1}=x^{''}_{s+2}=x^{'}_{s+2}=..=x^{''}_{t-2}=x^{'}_{t-2}=x^{''}_{t-1}=x^{'}_{t-1}.\\
    &\text{And,if a stable sorting algorithm (see appendix A.9) is applied, we can get}\\
    &-0.5=x^{''}_{s+1}=x^{''}_{s+2}=...=x^{''}_{t-2}=x^{''}_{t-1}< x^{''}_t\leq x^{''}_{t+1}...\leq x^{''}_n\leq 0<x^{''}_1\leq x^{''}_2\leq ...\leq x^{''}_s<0.5,\\
    &\text{therefore }m^{''}=N-\sum_{i=1}^n round(r_iN)=\sum_{i=1}^n[r_iN-round(r_iN)]=-\sum_{i=1}^n[x^{''}]=-[\sum_{i=1}^nx^{'}]-s=m^{'}-s.\\
    &\text{If }m^{''}=m^{'}-s= 0,\\
    &\text{then }m^{'}= s,\\
    &\text{so, }\forall i \in \{1,2,...,s\},b^{'}_i=1,\forall i \in \{s+1,s+2,...,n\},b^{'}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,...,s\},y^{'}_i=floor(r_iN)+1,\forall i \in \{s+1,s+2,...,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,...,floor(r_{s}N)+1,floor(r_{s+1}N),floor(r_{s+2}N),...,floor(r_{n}N)].\\
    &\text{Because }m^{''}= 0,\\
    &\text{so, }\forall i \in \{1,2,...,n\},b^{''}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,...,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),...,round(r_nN)],\\
    &\text{hence, }\forall i \in I_s~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in I_{st }y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0,\\
    &~~~~~~\forall i \in  I_{tn }y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0.\\
    &\text{If }m^{''}=m^{'}-s> 0,\\
    &\text{then }m^{'}> s,\\
    &\text{so, }\forall i \in \{1,2,...,s-1,s,s+1,...,m^{'}\},b^{'}_i=1,\forall i \in \{m^{'}+1,m^{'}+2,...,n\},b^{'}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,...,s-1,s,s+1,...,m^{'}\},y^{'}_i=floor(r_iN)+1,\forall i \in \{m^{'}+1,m^{'}+2,...,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,...,floor(r_{s-1}N)+1,\\
    &~~~~floor(r_{s}N)+1,floor(r_{s+1}N)+1,...,floor(r_{m^{'}}N)+1,\\
    &~~~~floor(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),...,floor(r_{n}N)].\\
    &\text{Because }m^{''}> 0,\\
    &\text{so, }\forall i \in \{s+1,s+2,...,s+m^{'}-s\},b^{''}_i=1,\forall i \in \{1,2,...,s,m^{'}+1,m^{'}+2...,n\},b^{''}_i=0,\\
    &\text{therefore, }forall i \in \{s+1,s+2,...,m^{'}\},y^{'}_i=round(r_iN)+1,\forall i \in \{1,2,...,s,m^{'}+1,m^{'}+2...,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),...,round(r_{s}N),\\
    &~~~~round(r_{s+1}N)+1,round(r_{s+2}N)+1,...,round(r_{m'}N)+1,\\
    &~~~~round(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),...,floor(r_{n}N)].\\
    &\text{hence, }\forall i \in I_s~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{s+1,s+2,...,m^{'}\}~y^{''}_i-y^{'}_i=round(r_iN)+1-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN+1-(floor(r_iN)-r_iN+1)=x^{''}_i+1-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{m^{'}+1,m^{'}+2,...,n-1,n\}~y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-(x^{'}_i)=0.\\
    &\text{If }m^{''}=m^{'}-s< 0,\\
    &\text{then }Wm^{'}< s,\\
    &\text{so, }\forall i \in \{1,2,...,m^{'}\},b^{'}_i=1,\forall i \in \{m^{'}+1,m^{'}+2,...,s,s+1,...,n-1,n\},b^{'}_i=0,\\
    &\text{therefore }\forall i \in \{1,2,...,m^{'}\},y^{'}_i=floor(r_iN)+1,\forall i \in \{m^{'}+1,m^{'}+2,...,s,s+1,...,n-1,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,...,floor(r_{m^{'}}N)+1,\\
    &~~~~floor(r_{m^{'}+1}N),floor(r_{m^{'}+2}N),...,floor(r_sN),\\
    &~~~~floor(r_{s+1}N),...,floor(r_{n-1}N),floor(r_{n}N)].\\
    &\text{Because }m^{''}< 0,\\
    &\text{so, }\forall i \in \{s-[s-m^{'}]+1,s-[s-m^{'}]+2,...,s\},b^{''}_i=-1,\forall i \in \{1,2,...,s-[s-m^{'}],s+1,s+2...,n\},b^{''}_i=0,\\
    &\text{therefore }\forall i \in \{m^{'}+1,m^{'}+2,...,s\},y^{'}_i=round(r_iN)-1,\forall i \in \{1,2,...,m^{'},s+1,s+2,...,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),...,round(r_{m^{'}}N),\\
    &~~~~round(r_{m^{'}+1}N)-1,round(r_{m^{'}+2}N)-1,...,round(r_{s}N)-1,\\
    &~~~~round(r_{s+1}N),floor(r_{s+2}N),...,round(r_nN)],\\
    &\text{hence }\forall i \in  \{1,2,...,m^{'}\}~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{m^{'}+1,m^{'}+2,...,s\}~y^{''}_i-y^{'}_i=round(r_iN)-1-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in  \{s+1,s+2,...,n-1,n\}~y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN)=x^{''}_i-x^{'}_i=0.\\
    &\text{So,regardless of any }m^{''}, \text{there always be }\forall i \in \{1,2,...,n\}, y^{''}_i-y^{'}_i=0,\\
    &\text{i.e., }y^{''}=y^{'}.
    \end{aligned}
  $$

- Then, analyze the result of solution 1 when $round(\cdot)$ is as
  $\eqref{round_3}$

  $$
  \begin{aligned}
    \text{(III)If}&~round(\cdot)~\text{is }\forall x \in \mathbb{R^+}\cup\{0\},~round_3(x)=\begin{cases}
        \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor<0.5 \\
        \lfloor x\rfloor,\text{if }x-\lfloor x\rfloor=0.5,\lfloor x\rfloor \mod 2=0\\
        \lceil x\rceil,\text{if }x-\lfloor x\rfloor=0.5,\lceil x\rceil\mod 2= 0\\
        \lceil x\rceil,\text{if }x-\lfloor x\rfloor>0.5
        \end{cases},\text{ as \eqref{round_3}},\\
    &\text{then }\forall i \in \{1,2,...,n\}~x^{''}_i\\
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
    &~~~~0<x^{''}_1=x^{'}_1+1\leq x^{''}_2=x^{'}_2+1\leq ... \leq x^{''}_s=x^{'}_s+1<0.5,\\
    &\forall i \in I_{tn},-0.5<x^{'}_i\leq 0,x^{''}_i=x^{'}_i,\\
    &~~~~-0.5< x^{''}_t=x^{'}_t\leq x^{''}_{t+1}=x^{'}_{t+1}...\leq x^{''}_n=x_n\leq 0,\\
    &\text{assume that the element numbers of $I_{st}$ is }W \in \mathbb{N},\\
    &\text{define }I_{u}=\{u_1,u_2,...,u_k\} \subseteq I_{st}, \forall i \in I_{st},x^{'}_i=-0.5,\lfloor r_iN\rfloor~\mod 2=0,\\
    &\text{and define }I_{v}=\complement_{I_{st}}I_{u_1}=\{v_1,v_2,...,v_l\} \subseteq I_{st}, \forall i \in I_{st},x^{'}_i=-0.5,\lceil r_iN\rceil \mod 2=0,\\
    &~~~~\text{where }k,l\in \mathbb{N},\text{and}, \\
    &~~~~~~~~k+l=W,s<u_1<u_2<...<u_k<t,s<v_1<v_2<...<v_l<t,\\
    &\forall i \in I_{u},x^{'}_i=-0.5,x^{''}_i=x^{'}_i,\\
    &~~~~-0.5=x^{''}_{u_1}=x^{'}_{u_2}=...=x^{'}_{u_k},\\
    &\forall i \in I_{v},x^{'}_i=-0.5,x^{''}_i=x^{'}_i+1,\\
    &~~~~-0.5+1=0.5=x^{''}_{v_1}=x^{'}_{v_2}=...=x^{'}_{v_l}.\\
    &\text{And, if a stable sorting algorithm (see appendix A.9) is applied, we can get}\\
    &-0.5=x^{''}_{u_1}=x^{''}_{u_2}=...=x^{''}_{u_k}< x^{''}_t\leq x^{''}_{t+1}...\leq x^{''}_n\leq 0<x^{''}_1\leq x^{''}_2\leq ...\leq x^{''}_s<x^{''}_{v_1}=x^{'}_{v_2}=...=x^{'}_{v_l}=0.5,\\
    &\text{therefore }m^{''}=N-\sum_{i=1}^n round(r_iN)=\sum_{i=1}^n[r_iN-round(r_iN)]=-\sum_{i=1}^n[x^{''}]=-[\sum_{i=1}^nx^{'}]-(s+l)=m^{'}-(s+l).\\
    &\text{If }m^{''}=m^{'}-(s+l)= 0,\\
    &\text{then }m^{'}= s+l,\\
    &\text{so, }\forall i \in \{1,2,...,s,s+1,s+2,...,s+l\},b^{'}_i=1,\forall i \in \{s+l+1,s+l+2,...,n\},b^{'}_i=0,\\
    &\text{therefore }\forall i \in \{1,2,...,s,s+1,s+2,...,s+l\},y^{'}_i=floor(r_iN)+1,\forall i \in \{s+l+1,s+l+2,...,n\},y^{'}_i=floor(r_iN),\\
    &y^{'}=[floor(r_1N)+1,floor(r_2N)+1,...,floor(r_{s}N)+1,\\
    &~~~~floor(r_{s+1}N)+1,floor(r_{s+2}N)+1,...,floor(r_{s+l}N)+1,\\
    &~~~~floor(r_{s+l+1}N),floor(r_{s+l+2}N),...,floor(r_{n}N)].\\
    &\text{Because }m^{''}= 0,\\
    &\text{so, }\forall i \in \{1,2,...,n\},b^{''}_i=0,\\
    &\text{therefore, }\forall i \in \{1,2,...,n\},y^{'}_i=round(r_iN),\\
    &y^{''}=[round(r_1N),round(r_2N),...,round(r_nN)],\\
    &\text{hence }\forall i \in I_s~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1)=0,\\
    &~~~~~~\forall i \in \{s+1,s+2,...,s+l\}~y^{''}_i-y^{'}_i=round(r_iN)-(floor(r_iN)+1)\\
    &~~~~~~~~=round(r_iN)-r_iN-(floor(r_iN)-r_iN+1)=x^{''}_i-(x^{'}_i+1),\\
    &~~~~~~~~\text{there is no guarantee that }x^{''}_i=(x^{'}_i+1),\\
    &~~~~~~\forall i \in \{s+l+1,s+l+2,...,s+W\}~y^{''}_i-y^{'}_i=round(r_iN)-floor(r_iN)\\
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
    &~~~~~~~~~~~~=[1,0,0,1]\neq [0,0,0,0]\\
    \end{aligned}
  $$

- To conclude:

  $$
  \begin{aligned}
    &\text{Summarize the above and combine (I)(II)(III) as:}\\
    &~~~~\text{when the used sorting algorithm is stable as appendix A.9,}\\
    &~~~~\text{if }round(\cdot)~\text{function is as }\eqref{round_1},\text{or }\eqref{round_2},\\
    &~~~~~~~~\text{the result }y\text{ from solution }1,y^{'},\text{ is the same to the result }y\text{ from solution }2,y^{''},\\
    &~~~~\text{if }round(\cdot)~\text{function is as }\eqref{round_3},\\
    &~~~~~~~~\text{there is no guarantee that }y^{'}\text{ is the same to }y^{''}.
    \end{aligned}
  $$

[^1]: (2022, November 6). IEEE 754 - Wikipedia. En. https://en.wikipedia.org/wiki/IEEE_754

[^2]: (2022, November 6). IEEE 754 - Wikipedia. En. https://en.wikipedia.org/wiki/IEEE_754

[^3]: (2022, November 6). IEEE 754 - Wikipedia. En. https://en.wikipedia.org/wiki/IEEE_754

[^4]: (2022, November 6). IEEE 754 - Wikipedia. En. https://en.wikipedia.org/wiki/IEEE_754

[^5]: (2022, November 6). IEEE 754 - Wikipedia. En. https://en.wikipedia.org/wiki/IEEE_754

[^6]: (2022, November 17). Built-in Functions — Python 3.11.0 documentation. Docs. https://docs.python.org/3/library/functions.html?highlight=sorted#sorted

[^7]: (2022, November 17). Sorting algorithm - Wikipedia. En. https://en.wikipedia.org/wiki/Sorting_algorithm#Stability
