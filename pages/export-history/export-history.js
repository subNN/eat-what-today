// pages/export-history/export-history.js
Page({
  data: {
    historyList: [],
    groupedHistory: [],
    selectedDate: '',
    selectedDateText: '按日期筛选',
    allSelected: false,
    selectedCount: 0,
    totalCount: 0
  },

  onLoad() {
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
      
      grouped[yearMonth].records.push({
        ...item,
        checked: false
      });
    });

    // 转换为数组并按年月排序
    const groupedArray = Object.values(grouped).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    this.setData({ 
      groupedHistory: groupedArray,
      totalCount: historyList.length,
      allSelected: false,
      selectedCount: 0
    });
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
      records: filteredList.map(item => ({
        ...item,
        checked: false
      }))
    }];

    this.setData({ 
      groupedHistory: grouped,
      totalCount: filteredList.length,
      allSelected: false,
      selectedCount: 0
    });
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

  // 全选点击处理
  handleSelectAllClick() {
    const allSelected = !this.data.allSelected;
    const groupedHistory = this.data.groupedHistory.map(group => ({
      ...group,
      records: group.records.map(record => ({
        ...record,
        checked: allSelected
      }))
    }));
    const selectedCount = allSelected ? this.data.totalCount : 0;
    this.setData({ groupedHistory, allSelected, selectedCount });
  },

  // 单个历史记录选择切换
  toggleHistoryItem(e) {
    const { yearMonth, time } = e.currentTarget.dataset;
    const groupedHistory = [...this.data.groupedHistory];
    
    let totalSelected = 0;
    
    groupedHistory.forEach(group => {
      if (group.yearMonth === yearMonth) {
        group.records.forEach(record => {
          if (record.time === time) {
            record.checked = !record.checked;
          }
          if (record.checked) totalSelected++;
        });
      } else {
        group.records.forEach(record => {
          if (record.checked) totalSelected++;
        });
      }
    });

    const allSelected = totalSelected === this.data.totalCount;
    this.setData({ groupedHistory, allSelected, selectedCount: totalSelected });
  },

  // 获取选中的历史记录
  getSelectedHistory() {
    const selectedRecords = [];
    this.data.groupedHistory.forEach(group => {
      group.records.forEach(record => {
        if (record.checked) {
          selectedRecords.push(record);
        }
      });
    });
    return selectedRecords;
  },

  // 格式化历史记录为纯文本
  formatHistoryToText(selectedHistory) {
    let text = '';
    
    selectedHistory.forEach((record, index) => {
      text += `【${record.meal}】${record.time}\n`;
      
      record.dishes.forEach(dish => {
        const priceText = dish.price ? `¥${dish.price}` : '无';
        text += `  • ${dish.name}  ${priceText} × ${dish.quantity}\n`;
      });
      
      const totalText = record.totalPrice === '大于' 
        ? `大于¥${record.totalPriceAmount}` 
        : `¥${record.totalPrice}`;
      text += `  总价: ${totalText}\n`;
      
      if (index < selectedHistory.length - 1) {
        text += '\n';
      }
    });
    
    return text;
  },

  // 导出到文件(.txt)
  exportToFile() {
    const selectedHistory = this.getSelectedHistory();
    if (selectedHistory.length === 0) {
      wx.showToast({ title: '请选择要导出的历史', icon: 'none' });
      return;
    }

    const text = this.formatHistoryToText(selectedHistory);
    const fileName = `选菜历史_${this.getDateString()}.txt`;

    // 保存到文件
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

    fs.writeFile({
      filePath: filePath,
      data: text,
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
    const selectedHistory = this.getSelectedHistory();
    if (selectedHistory.length === 0) {
      wx.showToast({ title: '请选择要导出的历史', icon: 'none' });
      return;
    }

    const text = this.formatHistoryToText(selectedHistory);
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制到剪切板', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
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