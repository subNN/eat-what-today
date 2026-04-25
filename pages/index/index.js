// index.js
Page({
  data: {
    selectedMeal: '午餐',
    menus: [],
    expandedMenuIndex: -1,
    isRefreshing: false
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

  selectMeal(e) {
    const meal = e.currentTarget.dataset.meal;
    this.setData({ selectedMeal: meal });
  },

  toggleMenu(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      expandedMenuIndex: this.data.expandedMenuIndex === index ? -1 : index
    });
  },

  useMenu(e) {
    const index = e.currentTarget.dataset.index;
    const selectedMeal = this.data.selectedMeal;
    
    wx.navigateTo({
      url: `/pages/select-dish/select-dish?index=${index}&meal=${selectedMeal}`
    });
  },

  handleRefresh() {
    // 触发旋转动画
    this.setData({ isRefreshing: true });
    
    // 加载菜单数据
    this.loadMenus();
    
    // 动画结束后重置状态
    setTimeout(() => {
      this.setData({ isRefreshing: false });
    }, 600);
  }
});