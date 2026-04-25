// pages/select-dish/select-dish.js
Page({
  data: {
    menuIndex: -1,
    menu: {},
    selectedDishes: [],
    totalPrice: 0,
    selectedMeal: ''
  },

  onLoad(options) {
    // 从参数中获取菜单索引和餐别
    const menuIndex = options.index ? parseInt(options.index) : -1;
    const selectedMeal = options.meal || '午餐';
    
    this.setData({ menuIndex, selectedMeal });
    
    if (menuIndex !== -1) {
      const menus = wx.getStorageSync('menus') || [];
      const menu = menus[menuIndex];
      if (menu) {
        this.setData({ menu });
      }
    }
  },

  isDishSelected(dishName) {
    return this.data.selectedDishes.some(dish => dish.name === dishName);
  },

  toggleDishSelection(e) {
    const index = e.currentTarget.dataset.index;
    const dish = this.data.menu.dishes[index];
    const selectedDishes = [...this.data.selectedDishes];
    
    // 检查是否已选择
    const existingIndex = selectedDishes.findIndex(d => d.name === dish.name);
    if (existingIndex > -1) {
      // 已选择，取消选择
      selectedDishes.splice(existingIndex, 1);
    } else {
      // 未选择，添加选择
      selectedDishes.push({ ...dish, quantity: 1 });
    }
    
    this.setData({ selectedDishes });
    this.calculateTotal();
  },

  increaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const selectedDishes = [...this.data.selectedDishes];
    selectedDishes[index].quantity += 1;
    this.setData({ selectedDishes });
    this.calculateTotal();
  },

  decreaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const selectedDishes = [...this.data.selectedDishes];
    if (selectedDishes[index].quantity > 1) {
      selectedDishes[index].quantity -= 1;
    } else {
      selectedDishes.splice(index, 1);
    }
    this.setData({ selectedDishes });
    this.calculateTotal();
  },

  calculateTotal() {
    const selectedDishes = this.data.selectedDishes;
    const hasNoPriceDishes = selectedDishes.some(dish => dish.price === null);
    const total = selectedDishes.reduce((sum, dish) => {
      return sum + (dish.price || 0) * dish.quantity;
    }, 0);

    let totalPriceText = '';
    if (hasNoPriceDishes) {
      totalPriceText = '大于¥' + total.toFixed(2);
    } else {
      totalPriceText = '¥' + total.toFixed(2);
    }

    this.setData({ totalPrice: totalPriceText });
  },

  randomDish() {
    const { menu, selectedDishes } = this.data;
    if (!menu.dishes || menu.dishes.length === 0) {
      wx.showToast({ title: '该菜单暂无菜品', icon: 'none' });
      return;
    }

    // 过滤已选择的菜品
    const availableDishes = menu.dishes.filter(dish =>
      !selectedDishes.some(selected => selected.name === dish.name)
    );

    if (availableDishes.length === 0) {
      wx.showToast({ title: '所有菜品已选择', icon: 'none' });
      return;
    }

    // 随机选择一道菜
    const randomIndex = Math.floor(Math.random() * availableDishes.length);
    const randomDish = { ...availableDishes[randomIndex], quantity: 1 };

    // 添加到已选择菜品
    const newSelectedDishes = [...this.data.selectedDishes, randomDish];
    this.setData({ selectedDishes: newSelectedDishes });
    this.calculateTotal();
  },

  saveSelection() {
    const { selectedDishes, selectedMeal, totalPrice } = this.data;
    if (selectedDishes.length === 0) {
      wx.showToast({ title: '请先选择菜品', icon: 'none' });
      return;
    }

    // 生成时间戳（使用当前系统时间，格式：YYYY-MM-DD HH:MM:SS）
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // 创建菜单记录
    const menuRecord = {
      time,
      meal: selectedMeal,
      dishes: selectedDishes,
      totalPrice
    };

    // 保存到历史记录
    const history = wx.getStorageSync('history') || [];
    history.unshift(menuRecord);
    wx.setStorageSync('history', history);

    wx.showToast({ title: '菜单保存成功', icon: 'success' });
    wx.navigateBack();
  }
});