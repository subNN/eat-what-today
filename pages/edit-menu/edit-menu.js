// pages/edit-menu/edit-menu.js
Page({
  data: {
    menuName: '',
    dishes: [],
    dishName: '',
    dishPrice: '',
    dishUnit: '',
    menuIndex: -1,
    originalMenu: null,
    hasChanges: false,
    unitOptions: ['个', '份', '张', '碗', '自定义'],
    unitIndex: 0,
    customUnit: ''
  },

  onLoad(options) {
    // 重置所有数据
    this.setData({
      menuName: '',
      dishes: [],
      dishName: '',
      dishPrice: '',
      dishUnit: '',
      menuIndex: -1,
      originalMenu: null,
      hasChanges: false,
      unitOptions: ['个', '份', '张', '碗', '自定义'],
      unitIndex: 0,
      customUnit: ''
    });

    // 从参数中获取菜单索引
    const menuIndex = options.index ? parseInt(options.index) : -1;
    this.setData({ menuIndex });

    if (menuIndex !== -1) {
      // 编辑已有菜单
      const menus = wx.getStorageSync('menus') || [];
      const menu = menus[menuIndex];
      if (menu) {
        // 保存原始菜单数据用于比较
        this.setData({
          menuName: menu.name,
          dishes: JSON.parse(JSON.stringify(menu.dishes)),
          originalMenu: JSON.parse(JSON.stringify(menu))
        });
      }
    }
  },

  bindMenuName(e) {
    const value = e.detail.value;
    this.setData({ menuName: value });
    this.checkChanges();
  },

  bindDishName(e) {
    this.setData({ dishName: e.detail.value });
  },

  bindDishPrice(e) {
    this.setData({ dishPrice: e.detail.value });
  },

  bindUnitChange(e) {
    const index = e.detail.value;
    this.setData({ 
      unitIndex: index,
      customUnit: ''
    });
  },

  bindCustomUnit(e) {
    this.setData({ customUnit: e.detail.value });
  },

  addDish() {
    const { dishName, dishPrice, unitOptions, unitIndex, customUnit } = this.data;
    if (!dishName) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' });
      return;
    }
    
    // 确定单位
    let unit = unitOptions[unitIndex];
    if (unit === '自定义') {
      if (!customUnit) {
        wx.showToast({ title: '请输入自定义单位', icon: 'none' });
        return;
      }
      unit = customUnit;
    }

    const newDish = {
      name: dishName,
      price: dishPrice ? parseFloat(dishPrice) : null,
      unit: unit
    };

    const dishes = [...this.data.dishes, newDish];
    this.setData({
      dishes,
      dishName: '',
      dishPrice: '',
      unitIndex: 0,
      customUnit: ''
    });

    this.checkChanges();
    wx.showToast({ title: '添加成功', icon: 'success' });
  },

  deleteDish(e) {
    const index = e.currentTarget.dataset.index;
    const dish = this.data.dishes[index];
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${dish.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          const dishes = [...this.data.dishes];
          dishes.splice(index, 1);
          this.setData({ dishes });
          this.checkChanges();
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  },

  checkChanges() {
    const { menuName, dishes, originalMenu } = this.data;
    
    if (!originalMenu) {
      // 新建菜单，只要有内容就认为有变化
      this.setData({ hasChanges: menuName !== '' || dishes.length > 0 });
      return;
    }
    
    // 比较菜单名称
    if (menuName !== originalMenu.name) {
      this.setData({ hasChanges: true });
      return;
    }
    
    // 比较菜品数量
    if (dishes.length !== originalMenu.dishes.length) {
      this.setData({ hasChanges: true });
      return;
    }
    
    // 比较菜品内容
    for (let i = 0; i < dishes.length; i++) {
      const dish1 = dishes[i];
      const dish2 = originalMenu.dishes[i];
      if (dish1.name !== dish2.name || dish1.price !== dish2.price || dish1.unit !== dish2.unit) {
        this.setData({ hasChanges: true });
        return;
      }
    }
    
    // 没有变化
    this.setData({ hasChanges: false });
  },

  saveMenu() {
    const { menuName, dishes, menuIndex } = this.data;
    if (!menuName) {
      wx.showToast({ title: '请输入菜单名称', icon: 'none' });
      return;
    }

    const menus = wx.getStorageSync('menus') || [];
    const updatedMenu = {
      name: menuName,
      dishes
    };

    if (menuIndex !== -1) {
      // 编辑已有菜单
      menus[menuIndex] = updatedMenu;
      wx.showToast({ title: '菜单已更新', icon: 'success' });
    } else {
      // 新建菜单
      menus.push(updatedMenu);
      wx.showToast({ title: '菜单创建成功', icon: 'success' });
    }

    wx.setStorageSync('menus', menus);
    this.setData({ hasChanges: false });
    
    // 保存后返回
    setTimeout(() => {
      wx.navigateBack();
    }, 1000);
  },

  onUnload() {
    // 页面卸载时检查是否有未保存的更改
    if (this.data.hasChanges) {
      wx.showModal({
        title: '提示',
        content: '该菜单没有保存，是否保存后退出？',
        confirmText: '保存',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 保存后退出
            this.saveMenu();
          }
          // 取消则直接退出
        }
      });
    }
  }
});