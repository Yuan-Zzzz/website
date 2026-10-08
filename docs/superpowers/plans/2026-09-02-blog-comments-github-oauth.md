> Superseded on 2026-10-08 by giscus / GitHub Discussions. See docs/giscus-comments.md. This plan is historical only.

# GitHub 登录 + 文章评论 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为文章详情页添加 GitHub OAuth 游客登录与一级评论功能，支持用户删自己的评论、管理员删任意评论。

**Architecture:** 自建 MongoDB `User`/`Comment` 模型；`user-token` 与 `admin-token` 隔离；GitHub OAuth 回调签发 JWT；文章页 `CommentSection` 客户端组件调用 REST API。

**Tech Stack:** Next.js 16 App Router, MongoDB/Mongoose, jose JWT, GitHub OAuth

**Status:** Implemented 2026-09-02

---

Spec: `docs/superpowers/specs/2026-09-02-blog-comments-github-oauth-design.md`
