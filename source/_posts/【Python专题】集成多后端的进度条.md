---
abbrlink: 4df1fb5a
categories: Personal Experiences
date: "2023-10-25 16:22:37"
tags:
- Python
title: Progress bar with multiple backends
updated: "2024-03-16 12:14:05"
---

This article introduces a simple manner about integrating different
`Progress Bar` backends in Python.

<!-- more -->

# Introduction

[Progress Bar](https://en.wikipedia.org/wiki/Progress_bar): A **progress
bar** is a [graphical control
element](https://en.wikipedia.org/wiki/Graphical_control_element) used
to visualize the progression of an extended computer operation, such as
a download, file transfer, or installation. Sometimes, the graphic is
accompanied by a textual representation of the progress in a percent
format. The concept can also be regarded to include “playback bars” in
[media players](https://en.wikipedia.org/wiki/Media_player_(software))
that keep track of the current location in the duration of a media
file.[^1]

In recent decades, the progress bar may not have changed much in form,
but it has derived many more profound connotations such as
`progress bar user experience` and `progress bar design philosophy`.
But, the latter two are not our concern in this article. Here we only
talk about how to integrate multiple backends in Python.

(From [ChatGPT](https://chat.openai.com/) ) There are many continuously
updated light progress bar tools or big libraries that contains progress
bar widgets in Python, such as :

- [tqdm](https://tqdm.github.io/): `tqdm` means “progress” in Arabic
  (*taqadum*, تقدّم) and is an abbreviation for “I love you so much” in
  Spanish (*te quiero demasiado*). [^2]
- [progressbar2](https://progressbar-2.readthedocs.io/en/latest/index.html#):
  The progressbar is based on the old Python progressbar package that
  was published on the now defunct Google Code.[^3]
- [alive-progres](https://github.com/rsalmei/alive-progress):
  Introducing the newest concept in progress bars for Python!
  `alive-progress` is in a class of its own, with an array of cool
  features that set it apart. [^4]
- [yaspin](https://github.com/pavdmyt/yaspin): `Yaspin` provides a
  full-featured terminal spinner to show the progress during
  long-hanging operations.[^5]
- [rich](https://rich.readthedocs.io/en/latest/): Rich is a Python
  library for writing *rich* text (with color and style) to the
  terminal, and for displaying advanced content such as tables,
  markdown, and syntax highlighted code.[^6]
- [tf.keras.utils.ProgBar](https://www.tensorflow.org/api_docs/python/tf/keras/utils/Progbar):
  Displays a progress bar.[^7]

Why we need `progress bar` in Python?

Generally and natively, to monitor the status of a computer or a
program, we may print out some information at some nodes when running.
But when it comes to a big project or program, a huge of data will be
printed out at last in a run, which may exceed the text limitation of
the terminal window. And as a consequence, our print-out information
will lose its meaning since it cannot be checked totally.

For example, a deep learning training program based on
[TensorFlow](https://www.tensorflow.org/)/[Keras](https://keras.io/) may
require millions of loops (steps). Although we print out loop indices
and other information per 100 or 1000 steps, we still will encounter
thousands of print-out entries on the terminal, which is no doubt a
disaster since we cannot check all of them by poor-functional terminal
windows. Seriously, if the terminal is flooded with information, then
the content in the terminal will lose its meaning.

A common method to deal with the above problem is to divide monitoring
behavior into `logging` and `progress bar`， where `logging` records our
concerned information to the terminal window and files, and
`progress bar` shows progress information on the terminal window or in
other forms. The advantage of `logging` is it will record anything we
want toward files even though the data exceeds the text limitation of
the terminal window. We can still print out information on the terminal
window but we no longer rely on it to check all the information but only
consider it as a monitoring method. But `logging` is not the main idea
of this article and it will be talked about in later articles. Here we
only talk about `progress bar`.

# Methods and Results

Here we post 2 methods that integrate
[alive-progres](https://github.com/rsalmei/alive-progress) and
[tf.keras.utils.ProgBar](https://www.tensorflow.org/api_docs/python/tf/keras/utils/Progbar).
The principle is the same if merge into other backends.

## Patch a function with bar

Consider a function with `bar` argument as:

``` python
def test_func(bar:Callable=None):
    for _ in range(1000):
        if bar is not None:
            bar()
    pass
```

If we want this function to show progress bar when its called procedure,
we cam make a decorator function as:

``` python
import logging
import functools
import inspect
from inspect import Parameter
from typing import Callable, Literal
from typeguard import typechecked
import alive_progress
import tensorflow.keras as keras

@typechecked
def func_bar_injector(
    func:Callable=None,
    /,*
    total:int=None,
    title:str='UnknownBar',
    backend:Literal['keras','alive_progress']='alive_progress'):
    
    if func is None:
        return functools.partial(func_bar_injector,total=total,title=title,backend=backend)
    bar_param = Parameter('bar',Parameter.KEYWORD_ONLY,default=None,annotation=Callable)
    parameters = inspect.signature(func).parameters
    if ('bar' not in parameters):
        logging.getLogger(__name__).warn(f"{func.__name__} does not have kw `bar` ,\
                                         this func will not be injected by `bar` drawer.")
        return func
    elif str(parameters['bar']) != str(bar_param):
        logging.getLogger(__name__).warn(f"{func.__name__}'s `bar` is not `{bar_param}`, \
            this func will not be injected by `bar` drawer.")
        return func
    else:
        pass
    
    if backend == 'keras':
        @functools.wraps(func)
        def wrapped(*args,**kwargs):
            _bar = keras.utils.Progbar(total,width=30,verbose=1,interval=0.5,stateful_metrics=None,unit_name=title)
            _bar = functools.partial(_bar.add,1)
            return func(*args,**(kwargs|{'bar':_bar}))
        return wrapped
    elif backend == 'alive_progress':
        @functools.wraps(func)
        def wrapped(*args,**kwargs):
            with alive_progress.alive_bar(total=total,ctrl_c=False,title=title) as _bar: 
                return func(*args,**(kwargs|{'bar':_bar}))
        return wrapped
    else:
        raise ValueError(f"The backend should be `keras` or `alive_bar`, not {backend}")
```

Then the usage is as:

``` python
@func_bar_injector(total=1000,title='TestBar',backend='keras')
def test_func_1(bar:Callable=None):
    for _ in range(1000):
        if bar is not None:
            bar()
    pass
# or 
@func_bar_injector(total=None,title='TestBar',backend='alive_progress')
def test_func_2(bar:Callable=None):
    for _ in range(1000):
        if bar is not None:
            bar()
    pass   

# testing
test_func_1()
test_func_2()
```

The testing result is shown as the following:

<figure>
<img
src="https://raw.little-train.com/b5f4de28db1ff15f5d383edfa78ed018e23b3d9701e886615ef50c7f59ff23ca.png"
alt="patch-a-function-with-bar" />
<figcaption aria-hidden="true">patch-a-function-with-bar</figcaption>
</figure>

## Support contextual syntax

Consider a usage with `bar()` as:

``` python
for _ in range(1000):
    if bar is not None:
        bar()
pass
```

If we want to use `bar()` with a context manager, we can define a
customize class as:

``` python
import functools
from typing import Literal
from typeguard import typechecked
import alive_progress
import tensorflow.keras as keras

from utils.managers.log_manager import get_simple_logger
from collections import UserDict
class CustomBar():
    """
    >>> with CustomBar(20,'SomeTitle',backend='keras') as bar:
    >>>     for i in range(20):
    >>>         bar()
    or 
    >>> with CustomBar(20,'SomeTitle',backend='alive_progress') as bar:
    >>>     for i in range(20):
    >>>         bar()
    or
    >>> with CustomBar(40,'SomeTitle',backend='alive_progress') as bar:
    >>>     bar(20, skipped=True)
    >>>     for i in range(20,40):
    >>>         bar()
    """
    @typechecked
    def __init__(self,
                 total:int|None=None,
                 title:str='UnknownBar',
                 backend:Literal['keras','alive_progress']='alive_progress',
                 **kwargs):
        if backend == 'keras':
            self.bar = keras.utils.Progbar(target=total,width=30,verbose=1,\
                                           interval=0.5,stateful_metrics=None,unit_name=title,**kwargs)
        elif backend == 'alive_progress':
            self.bar = alive_progress.alive_bar(total=total,ctrl_c=True,title=title,**kwargs)
        else:
            raise ValueError(f"The backend should be `keras` or `alive_bar`, not {backend}")
    def __enter__(self):
        # print("Entering context...")
        if hasattr(self.bar,'__enter__') and callable(getattr(self.bar,'__enter__')):
            return self.bar.__enter__()
        elif hasattr(self.bar,'add') and callable(getattr(self.bar,'add')):
            return functools.partial(self.bar.add,1)
        else:
            raise ValueError(" ") # TODO
    
    def __exit__(self, *exc):
        if hasattr(self.bar,'__exit__') and callable(getattr(self.bar,'__exit__')):
            result = self.bar.__exit__(*exc)
        elif hasattr(self.bar,'add') and callable(getattr(self.bar,'add')):
            result = None
        else:
            raise ValueError(" ") # TODO
        # print("Exiting context...")
        return result
```

Then the usage and testing are as:

``` python
with CustomBar(20,'TestBar',backend='keras') as bar:
    for i in range(20):
        bar()
# or
with CustomBar(20,'TestBar',backend='alive_progress') as bar:
    for i in range(20):
        bar()
```

The testing result is shown as the following:

<figure>
<img
src="https://raw.little-train.com/984a1d142eab42c5896ce8badc82b48a4861c28038750f0395b4da1a998c23fb.png"
alt="support-contextual-syntax" />
<figcaption aria-hidden="true">support-contextual-syntax</figcaption>
</figure>

If one get used to functional form, a modified way can be:

``` python
def my_bar(total:int,title:str='UnknownBar',backend:Literal['keras','alive_progress']='alive_progress',**kwargs):
    """
    >>> with my_bar(20,'SomeTitle',backend='keras') as bar:
    >>>     for i in range(20):
    >>>         bar()
    or 
    >>> with my_bar(20,'SomeTitle',backend='alive_progress') as bar:
    >>>     for i in range(20):
    >>>         bar()
    or 
    >>> with my_bar(40,'SomeTitle',backend='alive_progress') as bar:
    >>>     bar(20, skipped=True)
    >>>     for i in range(20,40):
    >>>         bar()
    """
    return CustomBar(total=total,title=title,backend=backend,**kwargs)
```

Then the usage and testing are as:

``` python
with my_bar(20,'TestBar',backend='keras') as bar:
    for i in range(20):
        bar()
# or
with my_bar(20,'TestBar',backend='alive_progress') as bar:
    for i in range(20):
        bar()
```

The testing result is shown as the following:

<figure>
<img
src="https://raw.little-train.com/078ae032b20b54d33dbe30d284936afd729d76500ff0f398feba9b23427115f9.png"
alt="support-contextual-syntax-functional" />
<figcaption
aria-hidden="true">support-contextual-syntax-functional</figcaption>
</figure>

# Analysis and Conclusion

In this article, we post 2 simple methods to make a customized
`progress bar` with integrated
[alive-progres](https://github.com/rsalmei/alive-progress) and
[tf.keras.utils.ProgBar](https://www.tensorflow.org/api_docs/python/tf/keras/utils/Progbar)
as backends.

- The first method can be used to patch a existent function who has a
  `bar` argument. To realize the patching, `inspect` and `Parameter` are
  used.
- The second method can be used when one want a context manager to
  manage `progress bar` behavior. To realize the context manager,
  `__enter__` and `__exit__` should be override.

It is not difficult to find that if we want to integrate other backends,
the basic pattern is the same. It is nothing else but:

- Know the original (native) usage of the backend that will be
  integrated.
  - Supported usage.
  - Is `with` supported?
  - If `add()` function need arguments?
  - …
- Use the knowledge of python development to embed the backend,
  according the specific backend.

The main problem is, if 2 backends has different usages, like
[alive-progres](https://github.com/rsalmei/alive-progress) and
[tf.keras.utils.ProgBar](https://www.tensorflow.org/api_docs/python/tf/keras/utils/Progbar),
where the former only support `with` and the later only support
non-`with` , we need to write many extra codes to combine them together
with harmony. Therefore, this is the cost of integration.

The more integrated, the less commonality. The more `if-else`, the more
complexity. In the exemplification of this article, we have increased
the commonality and reduced the complexity (only the necessary `if-else`
is retained) as much as possible.

[^1]: (2023, April 30). Progress bar - Wikipedia. En. https://en.wikipedia.org/wiki/Progress_bar

[^2]: (2023, April 30). tqdm documentation. Tqdm. https://tqdm.github.io/

[^3]: (2023, April 30). Welcome to Progress Bar’s documentation! — Progress Bar 4.3b.0 documentation. Progressbar-2. https://progressbar-2.readthedocs.io/en/latest/index.html#

[^4]: (2023, April 30). rsalmei/alive-progress: A new kind of Progress Bar, with real-time throughput, ETA, and very cool animations!. Github. https://github.com/rsalmei/alive-progress

[^5]: (2023, April 30). pavdmyt/yaspin. Github. https://github.com/pavdmyt/yaspin

[^6]: (2023, April 30). Introduction — Rich 13.3.5 documentation. Rich. https://rich.readthedocs.io/en/latest/introduction.html

[^7]: (2023, April 30). tf.keras.utils.Progbar \| TensorFlow v2.12.0. Tensorflow. https://www.tensorflow.org/api_docs/python/tf/keras/utils/Progbar
