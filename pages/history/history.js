// history.js
Page({
  data: {
    historyMenus: [],
    selectedItems: [],
    isEditMode: false
  },

  onLoad() {
    this.loadHistory();
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    const historyMenus = wx.getStorageSync('historyMenus') || [];
    this.setData({ historyMenus, selectedItems: [] });
  },

  refreshHistory() {
    this.loadHistory();
    wx.showToast({ title: '刷新成功', icon: 'success' });
  },

  toggleEditMode() {
    this.setData({
      isEditMode: !this.data.isEditMode,
      selectedItems: []
    });
  },

  toggleSelectItem(e) {
    const index = e.currentTarget.dataset.index;
    const selectedItems = [...this.data.selectedItems];
    const itemIndex = selectedItems.indexOf(index);

    if (itemIndex > -1) {
      selectedItems.splice(itemIndex, 1);
    } else {
      selectedItems.push(index);
    }

    this.setData({ selectedItems });
  },

  clearAllHistory() {
    if (this.data.historyMenus.length === 0) {
      wx.showToast({ title: '暂无历史记录', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('historyMenus', []);
          this.setData({
            historyMenus: [],
            selectedItems: [],
            isEditMode: false
          });
          wx.showToast({ title: '历史记录已清空', icon: 'success' });
        }
      }
    });
  },

  deleteSingleHistory(e) {
    const index = e.currentTarget.dataset.index;
    const history = this.data.historyMenus[index];
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条历史记录吗？`,
      success: (res) => {
        if (res.confirm) {
          const historyMenus = [...this.data.historyMenus];
          historyMenus.splice(index, 1);
          wx.setStorageSync('historyMenus', historyMenus);
          this.setData({ historyMenus });
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  }
});