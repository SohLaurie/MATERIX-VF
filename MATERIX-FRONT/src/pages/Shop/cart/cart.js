import { createSlice } from '@reduxjs/toolkit';

export const cartSlice = createSlice({
  name: 'cart',
  initialState: [],
  reducers: {
    addProduct: (state, action) => {
      const product = action.payload;
      const existingItem = state.find(item => item.product.id === product.id);

      if (existingItem) {
        // Check stock limit before increasing
        if (existingItem.quantity < product.stock) {
          existingItem.quantity += 1;
        } else {
          alert(`Only ${product.stock} units of ${product.name} available`);
        }
      } else {
        if (product.stock > 0) {
          state.push({ product, quantity: 1 });
        } else {
          alert(`${product.name} is out of stock`);
        }
      }
    },
    decrease: (state, action) => {
      const id = action.payload;
      const existingItem = state.find(item => item.product.id === id);
      if (existingItem) {
        if (existingItem.quantity > 1) {
          existingItem.quantity -= 1;
        } else {
          // Remove the item completely
          return state.filter(item => item.product.id !== id);
        }
      }
    },
    deleteProduct: (state, action) => {
      const id = action.payload;
      return state.filter(item => item.product.id !== id);
    }
  }
});

export const { addProduct, decrease, deleteProduct } = cartSlice.actions;
export default cartSlice.reducer;