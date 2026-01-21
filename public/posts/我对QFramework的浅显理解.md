---
title: 我对QFramework的浅显理解
date: 2024-5-10
excerpt: 在使用并学习了一段时间QFramework后，有了一定的认知，这里分享一些我自己目前对QFramework的一些认识和总结
tags:
  - Unity
  - QFramework
  - 架构
share: "true"
---
在使用并学习了一段时间QFramework后，有了一定的认知，这里分享一些我自己目前对QFramework的一些认识和总结（不一定正确，欢迎指正）。

QFramework是一套分层的架构，何为分层？在我早期学习并制作Unity项目的时候，尝试使用`Manager Of Managers`的思路架构游戏程序，即一个Manager管理所有其他的Manager，每个Manager分别负责游戏各个模块的逻辑，例如SaveManager，InventoryManager，DialogueManger，UIManager，SceneManager，EventManager等，并将Manager设计为单例模式，将表现，逻辑和数据都写在里面，然后使用一个BaseManager统一管理这些Manager，我与团队的其他成员各自负责每个Manager的逻辑。最开始用来效果似乎还不错，但到项目越写越复杂的时候，会发现项目越来越难以维护。因为所有Manager几乎都在相互引用，在脑海里想像会让人感觉是在AnimatorController里面许多个动画相互连接的“蜘蛛网困境”，更要命的是，你有时候要实现自己所负责的Manager的一个功能时，需要改动其他人所负责的代码，因此在git合并时也常常造成冲突。

`Manager Of Managers`是架构吗？我认为是的，他将每个大功能大系统分开，设计为单例，又由一个中心统一管理，但这样的架构是松散的，他缺少限制导致其陷入“蜘蛛网困境”。QFramework引入分层的设计解决了这个问题，他将其系统架构分为四层：

`摘自QFramework的Github主页`
- 表现层：ViewController层。IController接口，负责接收输入和状态变化时的表现，一般情况下，MonoBehaviour 均为表现层
    - 可以获取System
    - 可以获取Model
    - 可以发送Command
    - 可以监听Event
- 系统层：System层。ISystem接口，帮助IController承担一部分逻辑，在多个表现层共享的逻辑，比如计时系统、商城系统、成就系统等
    - 可以获取System
    - 可以获取Model
    - 可以监听Event
    - 可以发送Event
- 数据层：Model层。IModel接口，负责数据的定义、数据的增删查改方法的提供
    - 可以获取Utility
    - 可以发送Event
- 工具层：Utility层。IUtility接口，负责提供基础设施，比如存储方法、序列化方法、网络连接方法、蓝牙方法、SDK、框架继承等。啥都干不了，可以集成第三方库，或者封装API
- 除了四个层级，还有一个核心概念——Command
    - 可以获取System
    - 可以获取Model
    - 可以发送Event
    - 可以发送Command
- 层级规则：
    - IController 更改 ISystem、IModel 的状态必须用Command
    - ISystem、IModel状态发生变更后通知IController必须用事件或BindableProperty
    - IController可以获取ISystem、IModel对象来进行数据查询
    - ICommand不能有状态
    - 上层可以直接获取下层，下层不能获取上层对象
    - 下层向上层通信用事件
    - 上层向下层通信用方法调用（只是做查询，状态变更用Command），IController的交互逻辑为特别情况，只能用Command

有了分层，我们就可以根据QFramework规则将我们散落到各处的Manager们有序的组织起来，我们可以将InventoryManager,DialogueManager,UIManager的逻辑写成InventorySystem，DialogueSystem，UISystem放在系统层，将相关的数据（如背包的数据，对话的数据）放在数据层，SaveSystemr负责数据的存储，放在工具层，而具体的表现的实现则放在表现层

QFramework里先实现了一个简单的IOC容器，仅仅能注册为单例，每次获取都为同一个实例，并用一个字典来维护.
QF中的代码:
```cs
public class IOCContainer
	{
		private Dictionary<Type, object> mInstances = new Dictionary<Type, object>();

		public void Register<T>(T instance)
		{
			var key = typeof(T);

			if (mInstances.ContainsKey(key))
			{
				mInstances[key] = instance;
			}
			else
			{
				mInstances.Add(key, instance);
			}
		}

		public T Get<T>() where T : class
		{
			var key = typeof(T);

			if (mInstances.TryGetValue(key, out var retInstance))
			{
				return retInstance as T;
			}

			return null;
		}
	}
```
然后给每个层都定义一个接口（`IController` `ISystem` `IModel` `IUtility`）在Architecture类中创建IOCContainer对象，分别定义每个层的注入和获取方法（例如`RegisterSystem<T>()`和`GetSystem<T>`）通过对应的方法，将对应层的实例注入到IOCContainer中

使用QFramework时，我们需要定义一个架构类，让其继承的`Architecture<T>`类（类中声明了一个IOCContainer对象），一个游戏项目一般只需要一个Architecture，这便是我们的**架构**。我们的所有System Model Utility都需要在架构初始化时进行注入，反之我们在获取也需要先获取**架构**，从架构中获取对应的实例（QFramework定义了一个 IBelongToArchitecture接口，实现静态拓展使得我们可以很方便的使用this关键字获取Architecture）

接下来我们就可以使用Register注入实例，用Get获取实例。这样看来，好像只是把很多个单例放入了一个容器里面，似乎跟直接使用一堆Manager并没有区别，是的，因为我们还没有进行**限制**

我们可以写一个文档，整个项目分成哪些层，给每个层设定对应的规则，就像上文QFramework的主页写的各个层级的规则一样，让团队成员根据文档去遵守，这样我们就用**文档架构**的形式去规范整个程序，但是人是会犯错的，指不定团队里某个人就因为粗心没有遵守这样的规则，给项目埋下隐患，这样的软性限制肯定是不行的。程序是严谨的，我们需要使用程序去限制各个层之间的关系

前面我们说到了`QFramework定义了IBelongToArchitecture和ICanSetArchitecture接口，实现静态拓展使得我们可以很方便的使用this关键字获取Architecture`,同样QFramework使用静态拓展的方法实现了对各个层级在程序上的**硬限制**，我们以`ICanGetModel`接口为例
```cs
    public interface ICanGetModel : IBelongToArchitecture
	{
	}

	public static class CanGetModelExtension
	{
		public static T GetModel<T>(this ICanGetModel self) where T : class, IModel =>
			self.GetArchitecture().GetModel<T>();
	}
```
我们可以看到，`ICanGetModel`接口继承了`IBelongToArchitecture`接口，该接口有一个`GetArchitecture()`方法使得该实现该接口的类可以获取Architecture，根据静态方法，我们就可以在实现ICanGetModel接口的类中，使用this关键字获取Model，而没有实现ICanGetModel的话，就不能使用，这样，就形成了**限制**。同理，其他层级也是类似的原理。这样我们在各个层级对应的接口中，就可以通过实现对应的**规则接口**(Rules)，来打到限制，例如
```cs
public interface ISystem : IBelongToArchitecture, ICanSetArchitecture, ICanGetModel, ICanGetUtility,
		ICanRegisterEvent, ICanSendEvent, ICanGetSystem
	{
		void Init();
	}
```
这样，就实现了系统层
    - 可以获取System
    - 可以获取Model
    - 可以监听Event
    - 可以发送Event
从而形成了限制，达到了程序成面上真正的分层

接下来，QFramework使用BindableProperty，TypeEvent，EasyEvent实现MVC，用Command分担ViewControler的逻辑等其他附加的功能，最终构成了QFramework的核心架构，此外QFramework还提供了可以脱离核心架构的常用的工具集，例如UIKit，AudioKit，ActionKit等，使得在开发游戏时使用QFramework会更加简便
