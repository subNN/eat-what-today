// menu.js
Page({
  data: {
    menus: [],
    selectedMenuIndex: -1,
    selectedMenus: [],
    isEditMode: false
  },

  onLoad() {
    this.loadMenus();
  },

  onShow() {
    this.loadMenus();
  },

  loadMenus() {
    const menus = wx.getStorageSync('menus') || [];
    this.setData({ menus, selectedMenus: [] });
    if (menus.length > 0) {
      this.setData({
        selectedMenuIndex: 0
      });
    }
  },

  createMenu() {
    wx.navigateTo({
      url: '/pages/edit-menu/edit-menu'
    });
  },

  goToImportExport() {
    wx.navigateTo({
      url: '/pages/import-export/import-export'
    });
  },

  editMenu(e) {
    let menuIndex = this.data.selectedMenuIndex;
    if (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.index) {
      menuIndex = parseInt(e.currentTarget.dataset.index);
    }
    
    if (menuIndex === -1) {
      wx.showToast({ title: '请先选择一个菜单', icon: 'none' });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/edit-menu/edit-menu?index=${menuIndex}`
    });
  },

  selectMenu(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedMenuIndex: index
    });
  },

  deleteMenu(e) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个菜单吗？',
      success: (res) => {
        if (res.confirm) {
          const menus = [...this.data.menus];
          menus.splice(index, 1);
          wx.setStorageSync('menus', menus);

          let selectedIndex = -1;
          if (menus.length > 0) {
            selectedIndex = 0;
          }

          this.setData({
            menus,
            selectedMenuIndex: selectedIndex
          });

          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  },

  toggleEditMode() {
    this.setData({
      isEditMode: !this.data.isEditMode,
      selectedMenus: []
    });
  },

  toggleSelectMenu(e) {
    const index = e.currentTarget.dataset.index;
    const selectedMenus = [...this.data.selectedMenus];
    const menuIndex = selectedMenus.indexOf(index);

    if (menuIndex > -1) {
      selectedMenus.splice(menuIndex, 1);
    } else {
      selectedMenus.push(index);
    }

    this.setData({ selectedMenus });
  },

  clearAllMenus() {
    if (this.data.menus.length === 0) {
      wx.showToast({ title: '暂无菜单', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有菜单吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('menus', []);
          this.setData({
            menus: [],
            selectedMenuIndex: -1,
            selectedMenus: [],
            isEditMode: false
          });
          wx.showToast({ title: '菜单已清空', icon: 'success' });
        }
      }
    });
  }
});