// pages/history/history.js
Page({
  data: {
    historyList: [],
    groupedHistory: [],
    selectedDate: '',
    selectedDateText: '按日期筛选'
  },

  onLoad() {
    this.loadHistory();
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    const historyList = wx.getStorageSync('history') || [];
    // 按时间倒序排序
    historyList.sort((a, b) => {
      return new Date(b.time) - new Date(a.time);
    });

    this.setData({ 
      historyList,
      selectedDate: '',
      selectedDateText: '按日期筛选'
    });

    this.groupHistoryByMonth(historyList);
  },

  // 按年月分组历史记录
  groupHistoryByMonth(historyList) {
    const grouped = {};
    
    historyList.forEach(item => {
      const date = new Date(item.time);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const yearMonth = `${year}年${month}月`;
      
      if (!grouped[yearMonth]) {
        grouped[yearMonth] = {
          yearMonth,
          year,
          month,
          expanded: false,
          records: []
        };
      }
      
      grouped[yearMonth].records.push(item);
    });

    // 转换为数组并按年月排序
    const groupedArray = Object.values(grouped).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    this.setData({ groupedHistory: groupedArray });
  },

  // 日期筛选
  onDateChange(e) {
    const selectedDate = e.detail.value;
    this.setData({ 
      selectedDate,
      selectedDateText: selectedDate
    });
    this.filterHistoryByDate(selectedDate);
  },

  // 按日期筛选历史记录
  filterHistoryByDate(date) {
    const historyList = wx.getStorageSync('history') || [];
    
    if (!date) {
      this.groupHistoryByMonth(historyList);
      return;
    }

    // 筛选指定日期的记录
    const filteredList = historyList.filter(item => {
      return item.time.startsWith(date);
    });

    // 按时间倒序排序
    filteredList.sort((a, b) => {
      return new Date(b.time) - new Date(a.time);
    });

    // 临时分组（只有一个日期，所以只有一个分组）
    const grouped = [{
      yearMonth: date,
      year: parseInt(date.substring(0, 4)),
      month: parseInt(date.substring(5, 7)),
      expanded: true,
      records: filteredList
    }];

    this.setData({ groupedHistory: grouped });
  },

  // 清除日期筛选
  clearDateFilter() {
    this.setData({ 
      selectedDate: '',
      selectedDateText: '按日期筛选'
    });
    this.loadHistory();
  },

  // 切换月份展开/收起
  toggleMonthExpand(e) {
    const key = e.currentTarget.dataset.key;
    const groupedHistory = this.data.groupedHistory.map(item => {
      if (item.yearMonth === key) {
        return { ...item, expanded: !item.expanded };
      }
      return item;
    });
    this.setData({ groupedHistory });
  },

  refreshHistory() {
    // 先显示加载提示
    wx.showLoading({ title: '刷新中...' });
    
    // 延迟一下，模拟网络请求，让用户看到刷新效果
    setTimeout(() => {
      this.loadHistory();
      wx.hideLoading();
      wx.showToast({ title: '已刷新', icon: 'success' });
    }, 500);
  },

  // 跳转到导出历史页面
  goToExportHistory() {
    if (this.data.historyList.length === 0) {
      wx.showToast({ title: '暂无历史记录', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/export-history/export-history'
    });
  },

  deleteHistory(e) {
    const { yearMonth, time } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          const historyList = wx.getStorageSync('history') || [];
          const filteredList = historyList.filter(item => item.time !== time);
          wx.setStorageSync('history', filteredList);
          this.loadHistory();
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  },

  clearAllHistory() {
    if (this.data.historyList.length === 0) {
      wx.showToast({ title: '暂无历史记录', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('history', []);
          this.setData({ historyList: [], groupedHistory: [] });
          wx.showToast({ title: '历史记录已清空', icon: 'success' });
        }
      }
    });
  }
});