import { 
  fetchProductsRequest, 
  fetchProductsSuccess, 
  fetchProductsFail,
  fetchProductRequest,
  fetchProductSuccess,
  fetchProductFail
} from './productSlice'; // adjust path if needed

import { getProducts, getProductById } from './lib/products';

export const fetchProducts = (filters = {}) => async (dispatch) => {
  dispatch(fetchProductsRequest());
  try {
    const products = await getProducts(filters);
    dispatch(fetchProductsSuccess({
      products: products,
      totalPages: 1,
      currentPage: 1,
    }));
  } catch (error) {
    dispatch(fetchProductsFail(error.message));
  }
};

export const fetchProductDetails = (id) => async (dispatch) => {
  dispatch(fetchProductRequest());
  try {
    const product = await getProductById(id);
    dispatch(fetchProductSuccess(product));
  } catch (error) {
    dispatch(fetchProductFail(error.message));
  }
};