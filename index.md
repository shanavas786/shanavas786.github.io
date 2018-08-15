---
layout: default
title:  Shanavas M
date:   2017-11-08
categories: rust
tags:
  - Rust
  - Emacs
  - Remacs
---


<ul class="post-list">
  {% for post in site.posts %}
    <li>
      <span class="post-meta">{{ post.date | date: "%b %-d, %Y" }}</span>
      <h2 class="post-link"><a href="{{ post.url }}">{{ post.title }}</a></h2>
      <p>{{ post.excerpt }}</p>
    </li>
  {% endfor %}
</ul>
