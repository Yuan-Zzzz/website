---
title: FNA集成FMOD记录
date: 2025-3-26 11:04:00 +0800
tags:
  - FMOD
  - FNA
  - MonoGame
  - XNA
excerpt: 记录FNA集成FMOD的过程
share: "true"
---

最近在学习并使用FNA开发游戏，为了更好的处理游戏音频，尝试接入FMOD

主要参考以下教程：
https://medium.com/@daisyowl/setting-up-fmod-for-a-c-game-38b5fe82f04a

在导入相关的DLL和C# API源码后 写入以下代码
代码如下：
``` cs
using FMOD.Studio;
using Gum.Wireframe;
using Microsoft.Xna.Framework;
using MonoGameGum;
using Nez;
using Nez.ImGuiTools;
using Project.Source.Scenes;

namespace Project.Source;
public class Event
{
    public static readonly FMOD.GUID BGM_BGM = new FMOD.GUID { Data1 = 70498606, Data2 = 1274959145, Data3 = 1737589438, Data4 = 336232275 };
}
public class GameRoot : Core
{
    public GameRoot() : base(1920, 1080, false, "ProjF")
    {
        Scene.SetDefaultDesignResolution(1920, 1080, Scene.SceneResolutionPolicy.ShowAll);
    }

    public static GraphicalUiElement UIRoot;
    public static FMOD.Studio.System FMODStudioSystem;

    protected override void Initialize()
    {
        base.Initialize();
        //初始化GUM
        GumService.Default.Initialize(
            this,
            "GumProject/GumProject.gumx");
        Scene = new GameplayScene();
        
        var imGuiManager = new ImGuiManager();
        RegisterGlobalManager( imGuiManager );
        
        FMOD.Studio.System.create(out var fmodStudioSystem);
        fmodStudioSystem.getCoreSystem(out var fmodSystem);
        fmodSystem.setDSPBufferSize(256, 4);
        fmodStudioSystem.initialize(
            128,
            FMOD.Studio.INITFLAGS.NORMAL,
            FMOD.INITFLAGS.NORMAL,
            (IntPtr)0
        );
        
        fmodStudioSystem.loadBankFile(
            // adjust this path to wherever you want to keep your .bank files
            "Desktop/Master.strings.bank",
            FMOD.Studio.LOAD_BANK_FLAGS.NORMAL,
            out Bank strings
        );
        fmodStudioSystem.loadBankFile(
            // adjust this path to wherever you want to keep your .bank files
            "Desktop/Master.bank",
            FMOD.Studio.LOAD_BANK_FLAGS.NORMAL,
            out Bank strin
        );
        fmodStudioSystem.loadBankFile(
            // adjust this path to wherever you want to keep your.bank files
            "Desktop/GamePlay.bank",
            FMOD.Studio.LOAD_BANK_FLAGS.NORMAL,
            out Bank sfx
        );
        fmodStudioSystem.loadBankFile(
            // adjust this path to wherever you want to keep your .bank files
            "Desktop/BGM.bank",
            FMOD.Studio.LOAD_BANK_FLAGS.NORMAL,
            out Bank bank
        );
        FMODStudioSystem = fmodStudioSystem;
        
        
      
        imGuiManager.SetEnabled(true);
    }

    protected override void Update(GameTime gameTime)
    {
        GumService.Default.Update(this,gameTime, UIRoot);
     
        FMODStudioSystem.update();
        base.Update(gameTime);

        if (Input.IsKeyPressed(Microsoft.Xna.Framework.Input.Keys.F10))
        {
            DebugRenderEnabled = !DebugRenderEnabled;
            FMODStudioSystem.getEventByID(Event.BGM_BGM, out EventDescription evDesc);
            evDesc.createInstance(out EventInstance evInst);
            evInst.setVolume(1);
            evInst.start();
        }
    }
}
```
需要注意的是，加载Bank文件时，为输出目录的**相对路径**，在这里调试了很久。。。
