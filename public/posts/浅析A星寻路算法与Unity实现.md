---
title: 浅析A星寻路算法与Unity实现
date: 2023-11-9
excerpt: A星寻路算法是游戏开发中常用的路径规划算法，本文将介绍A星算法的基本原理、步骤，并提供在Unity中实现A星寻路的示例代码。
tags:
  - Unity
  - 寻路算法
share: "true"
---

## 前言

由于目前正在做的项目需要找到最短路径，而说到最短路径，**A星寻路算法**是个最常听到的词，在加上这是面试常问（之前也面试确实问这个了），这里就对A星做个简单总结

## A星寻路算法是用来解决什么问题的

我们在玩英雄联盟时，通过鼠标右键点击地图上某个点时，玩家操作的英雄就会以**最短路径**，**避开障碍物**，行进至目标点。而A星寻路正是这个用途：**计算玩家或者NPC的行进路径，通过A星寻路算法可以计算出避开障碍物，到达目标点的最短路径**

## A星寻路的基本原理

A星算法基本逻辑是找到可以靠近目标点方向，一步步记录并行进，直到到达目标点，从而找到路径。A星寻路算法是一个基于网格地图来实现寻路的算法，无论是六边形网格还是四边形网格都可以，但是其实在大多数与A星相关的文章中，更多讨论的是**节点**，其原因就在于，如果我们仅仅将我们的寻路区域划分为四边形网格，显然是无法满足在我们游戏开发中的各种需求，我们可能还会将寻路区域划分成六边形，八边形，甚至是任意不规则的图形。而节点可以放在任意多边形的中心，或者放在多边形的顶点或者边上。所以即使我下面将使用简单的四边形网格讲述A星寻路的基本原理，我们依然用节点作为基准，使得我们讨论起这个系统更为简单。

## A星算法的几个基本概念

#### 寻路消耗公式

A星算法通过下面这个公式来计算每个节点的优先级

  

**F(寻路消耗) = G(离起点的消耗) + H(离终点的预计消耗)**

  

- F是当前节点的综合优先级。当我们选择下一个要遍历的节点时，我们总会选取综合优先级最高（值最小）的节点。

- G是当前节点距离起点的消耗。

- H是当前节点距离终点的**预计消耗**（预计的原因：忽略了障碍物）

  

寻路消耗公式是A星算法的核心

#### 开启列表和关闭列表

    开启列表和关闭列表是一个容器,用于存储我们的路径节点

- 开启列表
    开启列表类似一个购物清单，你去到超市可能会买清单上的东西，也可能不买，这个清单只是一个计划。开启列表里面节点可能是最终寻路结果会经过的点，也可能不经过，这是一个待定列表
- 关闭列表
    放入关闭列表中的节点，在寻路过程中加入过入关闭列表中的节点我们就不会再关注，防止重复搜索
#### 节点对象的父对象

在我们的寻路判断结束后，从终点开始，沿着每个节点的父节点至起点(无父节点)**回溯**，这便是寻路的路径

## A星算法的步骤

- 寻路初始状态
    - 将起点加入开启列表
- 进入主循环
    - 在开启列表中找到F值最低的点作为**当前节点**
    - 获取当前节点周围的八个非关闭节点和非障碍物**邻居节点**，并遍历这些节点
        - 判断每个节点如果在开启列表中
            - 将当前点设置为该邻居节点的父节点
            - 计算该邻居节点的G值
            - 计算该邻居节点的H值
            - 计算该邻居节点的F值（F = G + H）
            - 将当前节点加入到开放列表中
        - 否则
            - 计算邻居节点的G值
            - 如果G值比该邻居节点的G值小
                - 将当前点设置为该邻居节点的父节点
                - 更新该邻居节点的G值（这里不更改H值是因为H与父节点无关）
                - 更新该邻居节点的F值
    - 当终点在开启列表中时跳出循环
- 主循环结束，从终点回溯父节点，生成寻路的最终路径
## A星算法的具体实现
在实现A星算法前，我们需要先实现一个简单的四边形网格节点地图,本文的核心不在网格地图上，所以这里代码就写的不太严谨，仅供参考，包含以下脚本:
- Node类:挂载在每个单个节点脚本
- Map类:负责生成管理各种Node
### 网格地图参考代码

**Node类**

```cs

using UnityEngine;  

public class Node : MonoBehaviour  

{  
    public float h = 0; //离终点估计的距离  
    public float g = 0; //离起点的距离  
    public float f = 0; //寻路消耗  
    public Node parentNode; //当前节点的父级节点  
    private bool _isObstacle; //是否是障碍物  
    private Map _map;  
    public bool IsObstacle  
    {  
        get => _isObstacle;  
        set  
        {  
            ChangeColor(value == false ? Color.white : Color.red);  
            _isObstacle = value;  
        }    
     }  

    private MeshRenderer _meshRenderer;  

    private void Awake()  
    {        
        _meshRenderer = GetComponent<MeshRenderer>();  
        _map = GameObject.FindObjectOfType<Map>();  
    }  

    public void ChangeColor(Color color)  
    {  
         _meshRenderer.material.color = color;  
    }  

    private void OnMouseDown()  
    {
        if (_map.selectedOption == 0&&_map.startNode==null)  
        {
            _map.startNode = this;  
            ChangeColor(Color.blue);  
        }  
        else if(_map.selectedOption == 1&&_map.endNode==null)  
        {      
            _map.endNode = this;  
            ChangeColor(Color.yellow);  
        }  
        else if(_map.selectedOption == 2)  
        {            
	        IsObstacle = !IsObstacle;  
        }
    }
}

```

  

Map类

```cs

  

using System;  
using System.Collections.Generic;  
using UnityEngine;  
using Random = UnityEngine.Random;  

public class Map : MonoBehaviour  
{  
    public GameObject nodePrefab;  
    private GameObject[,] _nodes;  
    public GameObject[,] Nodes => _nodes;  
    public Vector2Int mapSize;  

    [Range(0,1)]  
    public float probability;  
    private Transform _selfTrans;  
    public Node startNode;  
    public Node endNode;  

    private void Awake()  
    {        
        _selfTrans = transform;  
        CreateMap();  
    }  

    private void Update()  
    {        
	    //空格刷新地图  
        if (Input.GetKeyDown(KeyCode.Space))  
        {            
            CreateMap();  
        }  
     }  

    private void CreateMap()  
    {        
        ClearMap();  
        _nodes = new GameObject[mapSize.x, mapSize.y];  
        for (int i = 0; i < mapSize.x; i++)  
        {            
            for (int j = 0; j < mapSize.y; j++)  
            {                
                _nodes[i, j] = Instantiate(nodePrefab, new Vector3(i, 0, j), Quaternion.identity);  
                _nodes[i, j].transform.SetParent(_selfTrans);  
                float f = Random.Range(0, 1.0f);  
                _nodes[i,j].GetComponent<Node>().IsObstacle = f <= probability; 
            }      
        }
    }  

    private void ClearMap()  
    {        
        if (_nodes == null || _nodes.Length == 0) return;  
        startNode = null;  
        endNode = null;  
        for (int i = 0; i < mapSize.x; i++)  
        {            
            for (int j = 0; j < mapSize.y; j++)  
            {                
                Destroy(_nodes[i, j].gameObject);  
            }  
        }  
        Array.Clear(_nodes, 0, _nodes.Length);  
    }    

    public int selectedOption = 0; // 默认选择第一个选项  
    private List<string> _options = new List<string>()  
    {  
        "设置起点","设置终点","绘制障碍"  
    };  

    private void OnGUI()  
    {   
	    GUILayout.BeginArea(new Rect(Screen.width -50, 0, 50, 1000)); // 定义绘制区域在屏幕右上角  
        GUILayout.BeginVertical();  
        GUIStyle buttonStyle = new GUIStyle(GUI.skin.button);  
        buttonStyle.fontSize = 10;  
        GUIStyle labelStyle = new GUIStyle(GUI.skin.label);  
        labelStyle.fontSize = 10;  
        // 显示选择的选项  
        for (int i = 0; i < _options.Count; i++)  
        {            
            bool isSelected = i == selectedOption;  
            GUI.enabled = !isSelected; // 禁用当前选中的按钮  
            if (GUILayout.Toggle(isSelected, _options[i], buttonStyle))  
            {                
                selectedOption = i;  
            }  
            GUI.enabled = true;  
        }        

        GUILayout.EndVertical();  
        GUILayout.EndArea();  

    }

}

```

### A星寻路算法代码

首先声明两个List表示我们的开启列表和关闭列表

```cs

public List<Node> openList;  
public List<Node> closeList;

```

  

以下是A星的核心算法

`FindPath`

```cs

public void FindPath(Node startNode, Node endNode)  
{  
    openList.Clear();  
    closeList.Clear();  
    openList.Add(startNode);  

    while (openList.Count > 0)  
    {        
        var currentNode = GetMinFNodeInOpenList();  
        openList.Remove(currentNode);  
        closeList.Add(currentNode);  

        if (currentNode == endNode)  
        {           
            break;  
        }        

        foreach (var surroundNode in GetSurroundNodes(currentNode))  
        {            
            if (surroundNode.IsObstacle || closeList.Contains(surroundNode))  continue;  
            float tempG = CalculateG(startNode ,surroundNode);  
            if (!openList.Contains(surroundNode))  
            {                
                surroundNode.parentNode = currentNode;  
                surroundNode.g = tempG;  
                surroundNode.h = CalculateH(surroundNode,endNode);  
                surroundNode.f = surroundNode.g + surroundNode.h;  
                openList.Add(surroundNode);  
            }           
            else if (tempG < surroundNode.g)  
            {                    
                surroundNode.parentNode = currentNode;  
                surroundNode.g = tempG;  
                surroundNode.f = surroundNode.g + surroundNode.h;  
            }      
        }
    }    
    GeneratePath(startNode,endNode);  
}

```