---
layout: post
title:  "Remacs - The journey so far.."
date:   2017-11-08
description: "Evolution of Remacs, The Rust port of Gnu Emacs"
categories: rust
excerpt:
  Evolution of lisp functions in Remacs, a project aimed at porting C part of Gnu Emacs to Rust.

tags:
  - Rust
  - Emacs
  - Remacs
---


### [](#intro) What, Remacs ?!!
Remacs is a project created by [Wilfred](https://github.com/Wilfred) aimed at
porting C part of Gnu Emacs to [Rust](https://www.rust-lang.org/). If you are a
programmer and don't know what Gnu Emacs is,
[**GO, CHECK NOW!!**](https://www.gnu.org/software/emacs/). You have been
missing one of the most powerful development tools.

It has been 4 months since my first
[contribution](https://github.com/Wilfred/remacs/pull/211) to
[Remacs](https://github.com/Wilfred/remacs). This post summarises the evolution
of primitive lisp function definition in Rust over time.  You can find more development
reports [here](http://www.wilfred.me.uk/archives/).


### [](#evolution) Evolution of Lisp functions in Rust

#### [](#fnsinc) Lisp Function Definition in C

In C, lisp function definition has two parts, _definition_ and _initialization_.
Definition uses a `DEFUN` macro and it looks like:

```c
DEFUN ("name-in-lisp", name_in_c, structname, min_args, max_args, intspec,
       doc: /*doc string*/) (arguments..)
{
    // function body
}
```

`DEFUN` macro creates a static `Lisp_Subr` struct and stores function metadata
ie, `name-in-lisp`, `min_args`, `max_args`, `intspec` and `doc` along with a pointer to
`name_in_c` function in its fields.

During initialization, `defsubr` function creates `Lisp_Object`s corresponding to each
`Lisp_Subr`. These `defsubr`s are collected in a `syms_of_module` function in
each C file and are invoked at startup by the `main` function in `emacs.c`.

```c
void syms_of_module (void) {
    defsubr (&struct_name);
}
```

#### [](#earlyattempts) Moving To Rust, Early Attempts

Enough C for now. Let's have a look at the Rust part. The very first attempts to
port lisp function was to literally rewrite the expanded `DEFUN` macro in Rust.
As a result, definition in Rust was extremely verbose at the beginning.

```rust
fn name_in_c(arguments..) -> LispObject {
    // function body
}

lazy_static! {
    pub static ref structname: LispSubr = LispSubr {
        header: VectorLikeHeader {
            size: ((PvecType::PVEC_SUBR as libc::c_int) <<
                   PSEUDOVECTOR_AREA_BITS) as ptrdiff_t,
        },
        function: (name_in_c as *const libc::c_void),
        min_args: min_args,
        max_args: max_args,
        symbol_name: ("name-in-lisp\0".as_ptr()) as *const c_char,
        intspec: intspec
        doc: ("docstring".as_ptr()) as *const c_char,
    };
}
```
And initialization in `rust_src/lib.rs`:

```rust

pub extern "C" fn rust_init_syms() {
    unsafe {
       defsubr(&*module::structname);
    }
}
```
For simplicity I keep both of definition and initialization code in a single block in this post.

#### [](#defun) `defun!` macro

Later on, the `lazy_static!` part has been replaced by a `defun!` macro. Which
shortened the definition to:

```rust
fn name_in_c(arguments..) -> LispObject {
    // function body
}

defun!("name-in-lisp", name_in_c, structname, min_args, max_args, ptr::null(), "docstring");

pub extern "C" fn rust_init_syms() {
    unsafe {
       defsubr(&*module::structname);
    }
}
```
Yes, `defun!` was a great improvement and syntax was comparable to C. But that was
not the best what Rust can offer. After a couple of months, [Jean Pierre Dudey](https://github.com/jeandudey)
proposed `lisp_fn` procedural macro in [PR 181](https://github.com/Wilfred/remacs/pull/181/).

#### [](#lispfn) `lisp_fn` Procedural Macro

Procedural macro a.k.a syntax extension a.k.a compiler plugin is a powerful Rust
feature that allows manipulation code on the fly. It enables user to define
functions that takes some Rust code, manipulates and produces Rust code as
output.

`lisp_fn` has made function definitions more concise. It derives name of
function in lisp by replacing underscores with hyphens and calculates minimum
and maximum number of arguments from the function signature. The
definition now looks like:

```rust
/// docstring
#[lisp_fn(name="optional_name",min="min_args")]
fn name_in_c(arguments..) -> LispObject {
    // function body
}

pub extern "C" fn rust_init_syms() {
    unsafe {
       defsubr(&*module::structname);
    }
}
```

#### [](#more-magic) More magic...

Though `lisp_fn` has made defining lisp functions easier, there were some nits.
Rust, by default, does not expose functions to higher scopes. So, functions
defined in the Rust cannot be called from C until the compiler is instructed to
export them.

This has resulted in accumulation of whole list of functions which are ported to
Rust and still referenced from C besides `rust_init_syms` function which holds
the entire list of ported functions in `rust_src/lib.rs` file.

There were a couple of attempts to tackle some of this mess.
[Sean Perry](https://github.com/shaleh) implemented a comprehensive solution
which utilizes Rust's build script to scan the entire rust code base and export
all the lisp functions. The script also creates a `module_exports.rs` file for
each modules that calls `defsubr` on lisp functions defined on that module
wrapped in a `rust_init_syms` function.

This reduced the size of `rust_src/lib.rs` file from around 500 lines to 88
lines with an overhead of single line in module files.

#### [](#next) What Next ?

The Rust language is improving day by day so does Remacs. So we can expect more.
