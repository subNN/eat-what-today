// index.js
Page({
  data: {
    mealTypes: ['早餐', '午餐', '晚餐', '加餐'],
    selectedMeal: '午餐',
    menus: [],
    selectedMenuIndex: -1,
    dishes: [],
    selectedDishes: [],
    totalPrice: 0,
    showChooseDialog: false,
    expandedMenuIndex: -1
  },

  onLoad() {
    this.loadMenus();
  },

  onShow() {
    this.loadMenus();
  },

  loadMenus() {
    const menus = wx.getStorageSync('menus') || [];
    this.setData({ menus });
  },

  refreshDishes() {
    const menus = wx.getStorageSync('menus') || [];
    this.setData({ menus });
    wx.showToast({ title: '刷新成功', icon: 'success' });
  },

  selectMeal(e) {
    const meal = e.currentTarget.dataset.meal;
    this.setData({ selectedMeal: meal });
  },

  toggleMenuExpand(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      expandedMenuIndex: this.data.expandedMenuIndex === index ? -1 : index
    });
  },

  useMenu(e) {
    const index = e.currentTarget.dataset.index;
    const menu = this.data.menus[index];
    
    wx.showModal({
      title: '确认使用',
      content: `确定要使用"${menu.name}"菜单吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/select-dish/select-dish?index=${index}&meal=${this.data.selectedMeal}`
          });
        }
      }
    });
  }
});