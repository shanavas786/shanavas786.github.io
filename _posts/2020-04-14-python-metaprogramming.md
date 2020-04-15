---
layout: post
title: "Generating classes and methods at runtime with python Metaprogramming"
date: 2020-04-14
description: "Generating classes and methods at runtime with python Metaprogramming"
categories: python
excerpt:
  Leverages python metaprogramming techniques to construct classes and methods at runtime
  to replace code generation script

tags:
  - python
  - metaprogramming
---

I started reading [Crafting Interpreters](https://craftinginterpreters.com) by _Bob Nystrom_
a few days ago. It is really a good start if you are looking for a practical introduction to
compilers. It takes you through design and implementation of a tiny language _Lox_

_Bob Nystrom_ uses _Java_ to implement the interpreter. Though I am comfortable
with _Java_, I wanted to implement the interpreter in _Python_ in parallel. I
implemented the features myself and used his _Java_ code to verify my
implementation. This helped me to understand the concepts better. As you may
have expected, _Python_ version was more concise than the corresponding
_Java_ implementation.

## [](#code-generator-script) Code Generation Script


It is a common practice to use scripts to generate repetitive code that would be
a tedious job to write otherwise. _Bob_ follows the same approach to generate java
classes for representing expression types in [5th Chapter](https://craftinginterpreters.com/representing-code.html)
of the book. The script generates class definitions from class name and a list
of member field names and types.


```java
defineAst(outputDir, "Expr", Arrays.asList(
      "Binary   : Expr left, Token operator, Expr right",
      "Grouping : Expr expression",
      "Literal  : Object value",
      "Unary    : Token operator, Expr right"
    ));
```

The above snippet generates

```java
abstract class Expr {
  static class Binary extends Expr {
    Binary(Expr left, Token operator, Expr right) {
      this.left = left;
      this.operator = operator;
      this.right = right;
    }

    @Override
    <R> R accept(Visitor<R> visitor) {
      return visitor.visitBinaryExpr(this);
    }

    final Expr left;
    final Token operator;
    final Expr right;
  }
  // rest of the class definitions
}
```

Use of code generation scripts introduces additional steps to the compilation process.

1. compile the code generation script
2. run the script to generate code
3. compile the application code


## [](#the-pythonic-way) The Pythonic Way

_Lox_'s python implementations listed at [Project Wiki](https://github.com/munificent/craftinginterpreters/wiki/Lox-implementations)
follows the same approach to generate the code. An alternative way is to use
[Metaprogramming](https://en.wikipedia.org/wiki/Metaprogramming).
Metaprogramming is a programming technique in which a piece of code manipulates
some other code. Languages like _C_ has macros for this purpose. Python comes
with a number of tools that enables Metaprogramming. `type` class, Metaclasses
and `eval` are some. I am using `type` to create python classes at runtime.

#### [](#use-type) Create class with type

A simple class definition

```python
class A():
  pass
```

is equivalent to

```python
A = type('A', (), {})
```

Let's take a closer look at the arguments of `type`. The first argument is class
name which is `A` here. The seconds argument is a tuple of base classes that
newly created class will extend. So to create another class `B` that extends can
be created as follows.

```python
type('B', (A,), {})
```

The third argument to type function is attribute mapping. Class attributes
binding can be provided there. For example,

```python
class C(A):
  attr1 = 2
  attr2 = 3
```

corresponds to

```python
C = type('C', (A,), {"attr1": 2, "attr2": 3})
```

In _Python_, methods are also class attributes. In the following snippet,

```python
class D():
  bar = 1

  def foo(bar):
    print("foo", bar)
```

both `foo` and `bar` are attribute to class `D`. The difference is that `bar` is
an instance of `int` class where `foo` is an instance of `function` class. So

```python
def foo(bar):
  print("foo")

class D():
  pass

D.bar = 1
D.foo = foo
```

means the same thing to the interpreter.


#### [](#python-method-invocation) Method invocation in _Python_

In _Python_ object model, methods are bound to classes, not objects (functions
can be bound to instances as well, let's ignore that for now). When a method is
invoked on an object, python search for the method name in attribute mapping of
objects' class and the classes it inherit from. Once the attribute is found, it
is invoked with the object as the first parameter (_self_ !). In a nutshell,

```python
d = D()
d.foo()
```
is equivalent to

```python
d = D()
D.foo(d)
```

#### [](#create-functions) Create functions at runtime

Now we know how to create a class at runtime and bind existing functions to it.
That has some limitation. We need to define a constructor and a accept method
for each child class.

Or can we create functions at runtime ?. Yes. closures for the rescue.
Closure is function that remembers its enclosed environment.

```python
def create_adder(addend):
  def adder(n):
    return n + addend

  return adder

adder10 = create_adder(10)
adder20 = create_adder(20)
assert adder10(5) == 15
assert adder20(5) == 25
```

The function returned from `create_adder` "remembers" its enclosed environment
and hence the value of addend. This allows us to create functions at runtime and
control its behavior.


## [](#lets-build) Lets build it

We are fully armed to create classes and functions at runtime. Lets build one.

```python
Expr = type("Expr", (), {})
Binary = type("Binary", (Expr,), {})

def build_init(fields):
  def init(self, *args):
    for field, val in zip(fields, args):
      setattr(self, field, val)

Binary.__init__ = build_init(["left", "operator", "right"])
```

Note that we need to bind the return value of `type` to a name explicitly. Where
as class definitions does that automatically. This brings some interesting issue.
Classes created inside a block (function/loop) won't available in the outer
scope which makes it pretty much useless. We can inject the binding to `globals`
manually to overcome this limitation.


```python
def build_init(fields):
  def init(self, *args):
    for field, val in zip(fields, args):
      setattr(self, field, val)

def build_class(name, base, fields):
    base_class = globals()[base]
    klass = type(name, (base_class,), {})
    klass.__init__ = build_init(fields)
    globals()[name] = klass

build_class("Expr", None, [])
build_class("Binary", "Expr", ["left", "operator", "right"])
```

Though binding injections works fine, I prefer using a proxy object to access
auto generated classes. The proxy class maintains a mapping of names to classes
and leverages `__getattr__` method to expose them as its attributes.


```python
class Proxy():
  def __init__(self):
    self._map = {}

  def __getattr__(self, name):
    try:
      return self._map[name]
    except KeyError:
      raise AttributeError

  def add_mapping(self, name, klass):
    self._map[name] = klass

proxy = Proxy()
```

With the proxy class, `build_class` function can be modified to

```python
def build_class(name, base, fields):
    base_class = getattr(proxy, base)
    klass = type(name, (base_class,), {})
    klass.__init__ = build_init(fields)
    proxy.add_mapping(name, class)
```

That's it!. Now you can import `proxy` and access the mapped classes as its
attributes `proxy.Expr` and `proxy.Binary`. I tried to keep the snippets above
simple and concise. You can find the actual implementation
[here](https://github.com/shanavas786/coding-fu/blob/b2c85b06c19400b1336c123de0ee692b8403c57e/crafting-interpreters/python/lox/ast.py).
