// pages/import-export/import-export.js
Page({
  data: {
    menus: [],
    menuList: [],
    allSelected: false,
    menuSelectionExpanded: false,
    selectedMenuName: '选择菜单',
    selectedCount: 0,
    singleMenuExample: `{
  "name": "我的菜单",
  "dishes": [
    {"name": "宫保鸡丁", "price": 25, "unit": "份"},
    {"name": "米饭", "price": 2, "unit": "碗"},
    {"name": "免费汤", "price": null, "unit": "碗"}
  ]
}`,
    multipleMenuExample: `[
  {
    "name": "川菜菜单",
    "dishes": [
      {"name": "麻婆豆腐", "price": 18, "unit": "份"},
      {"name": "回锅肉", "price": 28, "unit": "份"}
    ]
  },
  {
    "name": "家常菜菜单",
    "dishes": [
      {"name": "西红柿炒蛋", "price": 12, "unit": "份"},
      {"name": "紫菜蛋花汤", "price": 8, "unit": "碗"}
    ]
  }
]`
  },

  onLoad() {
    this.loadMenus();
  },

  loadMenus() {
    const menus = wx.getStorageSync('menus') || [];
    const menuList = menus.map(menu => ({
      name: menu.name,
      dishCount: menu.dishes.length,
      checked: false,
      originalIndex: menus.indexOf(menu)
    }));
    this.setData({ 
      menus, 
      menuList,
      selectedMenus: [], 
      allSelected: false,
      menuSelectionExpanded: false,
      selectedMenuName: '选择菜单',
      selectedCount: 0
    });
  },

  // 计算选中的菜单名称
  updateSelectedMenuName() {
    const { menuList, selectedCount, menus } = this.data;
    let selectedMenuName;
    
    if (selectedCount === 0) {
      selectedMenuName = '选择菜单';
    } else if (selectedCount === menus.length) {
      selectedMenuName = '全选';
    } else if (selectedCount === 1) {
      const selectedItem = menuList.find(item => item.checked);
      selectedMenuName = selectedItem ? selectedItem.name : '选择菜单';
    } else {
      selectedMenuName = `已选择 ${selectedCount} 个菜单`;
    }
    
    this.setData({ selectedMenuName });
  },

  // 切换菜单选择下拉
  toggleMenuSelection() {
    this.setData({ menuSelectionExpanded: !this.data.menuSelectionExpanded });
  },

  // 全选点击处理
  handleSelectAllClick() {
    const allSelected = !this.data.allSelected;
    const menuList = this.data.menuList.map(item => ({
      ...item,
      checked: allSelected
    }));
    const selectedCount = allSelected ? menuList.length : 0;
    this.setData({ menuList, allSelected, selectedCount });
    this.updateSelectedMenuName();
  },

  // 单个菜单选择切换
  toggleMenuItem(e) {
    const index = e.currentTarget.dataset.index;
    const menuList = [...this.data.menuList];
    
    // 切换选中状态
    menuList[index].checked = !menuList[index].checked;
    
    // 计算选中的数量
    const selectedCount = menuList.filter(item => item.checked).length;
    
    // 判断是否全选
    const allSelected = selectedCount === menuList.length;
    
    this.setData({ menuList, allSelected, selectedCount });
    this.updateSelectedMenuName();
  },

  // 获取选中的菜单
  getSelectedMenus() {
    const { menuList, menus } = this.data;
    const selectedItems = menuList.filter(item => item.checked);
    return selectedItems.map(item => menus[item.originalIndex]);
  },

  // 导出到文件
  exportToFile() {
    const selectedMenus = this.getSelectedMenus();
    if (selectedMenus.length === 0) {
      wx.showToast({ title: '请选择要导出的菜单', icon: 'none' });
      return;
    }

    const jsonStr = JSON.stringify(selectedMenus, null, 2);
    const fileName = `菜单导出_${this.getDateString()}.json`;

    // 保存到文件
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

    fs.writeFile({
      filePath: filePath,
      data: jsonStr,
      encoding: 'utf8',
      success: () => {
        wx.showToast({ 
          title: '导出成功', 
          icon: 'success',
          duration: 2000
        });
        // 延迟打开文件，确保toast有足够时间显示
        setTimeout(() => {
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            success: () => {
              console.log('文件打开成功');
            },
            fail: (err) => {
              console.error('打开文件失败', err);
              wx.showToast({ title: '导出成功，请到文件管理查看', icon: 'none' });
            }
          });
        }, 1000);
      },
      fail: (err) => {
        console.error('写入文件失败', err);
        wx.showToast({ title: '导出失败', icon: 'none' });
      }
    });
  },

  // 复制到剪切板
  exportToClipboard() {
    const selectedMenus = this.getSelectedMenus();
    if (selectedMenus.length === 0) {
      wx.showToast({ title: '请选择要导出的菜单', icon: 'none' });
      return;
    }

    const jsonStr = JSON.stringify(selectedMenus, null, 2);
    wx.setClipboardData({
      data: jsonStr,
      success: () => {
        wx.showToast({ title: '已复制到剪切板', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  },

  // 从文件导入
  importFromFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success: (res) => {
        const filePath = res.tempFiles[0].path;
        const fs = wx.getFileSystemManager();

        fs.readFile({
          filePath: filePath,
          encoding: 'utf8',
          success: (data) => {
            this.parseAndImport(data.data, 'file');
          },
          fail: (err) => {
            console.error('读取文件失败', err);
            wx.showToast({ title: '读取文件失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        // 用户取消了选择
      }
    });
  },

  // 从剪切板导入
  importFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        if (!res.data) {
          wx.showToast({ title: '剪切板为空', icon: 'none' });
          return;
        }
        this.parseAndImport(res.data, 'clipboard');
      },
      fail: () => {
        wx.showToast({ title: '读取剪切板失败', icon: 'none' });
      }
    });
  },

  // 解析并导入数据
  parseAndImport(data, source) {
    try {
      const dataObj = JSON.parse(data);
      let menusToImport = [];

      // 判断是单个菜单还是多个菜单
      if (Array.isArray(dataObj)) {
        menusToImport = dataObj;
      } else if (typeof dataObj === 'object' && dataObj !== null && dataObj.name) {
        menusToImport = [dataObj];
      } else {
        wx.showToast({ title: 'JSON格式不正确', icon: 'none' });
        return;
      }

      // 验证并处理导入的菜单
      const validMenus = [];
      for (const menu of menusToImport) {
        if (!menu.name) {
          continue;
        }
        
        const validMenu = {
          name: menu.name,
          dishes: []
        };

        if (Array.isArray(menu.dishes)) {
          for (const dish of menu.dishes) {
            if (dish.name && dish.unit) {
              validMenu.dishes.push({
                name: dish.name,
                price: dish.price !== undefined && dish.price !== null ? parseFloat(dish.price) : null,
                unit: dish.unit
              });
            }
          }
        }

        validMenus.push(validMenu);
      }

      if (validMenus.length === 0) {
        wx.showToast({ title: '没有有效的菜单数据', icon: 'none' });
        return;
      }

      // 显示确认对话框
      wx.showModal({
        title: '确认导入',
        content: `将导入 ${validMenus.length} 个菜单，是否继续？`,
        success: (res) => {
          if (res.confirm) {
            // 获取现有菜单并合并
            const existingMenus = wx.getStorageSync('menus') || [];
            const mergedMenus = [...existingMenus, ...validMenus];
            wx.setStorageSync('menus', mergedMenus);
            
            wx.showToast({ 
              title: `成功导入 ${validMenus.length} 个菜单`, 
              icon: 'success' 
            });
            
            // 返回上一页
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        }
      });

    } catch (e) {
      console.error('解析JSON失败', e);
      wx.showToast({ title: 'JSON格式错误，解析失败', icon: 'none' });
    }
  },

  // 获取日期字符串
  getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
  }
});