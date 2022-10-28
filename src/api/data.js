import request from '@/utils/request'

export const queryTable = (data) =>
  request({
    url: '/getBus',
    method: 'post',
    data,
  })


  export const login = (data) =>
  request({
    url: '/login',
    method: 'post',
    data,
  })
  export const getCaptch = (params) =>
  request({
    url: '/getCaptch',
    method: 'get'
  })
