<template>
  <div class="">
    <TableHeader @search="onSearch">
      <input type="file" id='myFile' @change="readFile" />
      <a-button @click="Start">一键启动</a-button>
      <a-button style="margin-left: 16px" @click="handleExportExcel">{{
          $t('common.exportExcel')
      }}</a-button>
    </TableHeader>
    <a-table :columns="columns" :row-key="(record) => record.username" :data-source="state.tableData" :pagination="{
      defaultCurrent: 1,
      defaultPageSize: 5
    }" @change="handleTableChange">
      <template #action="{ record }">
        <a-button>{{ record.status ? '下单' : '' }}</a-button>
      </template>
      <template #status="{ record }">
        {{ { '0': '正在进行', '1': '成功', '2': '失败' }[record.status] }}
      </template>
    </a-table>
    <UpdateModal v-if="visible" :visible="visible" :update-data="updateData" @update="onUpdateTableItem"
      @cancel="visible = false" />
    <img :src="src" width="280" height="87" alt="验证码" @click="getVerifyCode">
    <img src="" alt="">
  </div>
</template>

<script setup>
import { queryTable, login, getCaptch } from '@/api/data'
import { onMounted, ref, unref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import axios from 'axios'
// import AddModal from './component/AddModal.vue'
import UpdateModal from './component/UpdateModal.vue'
import Tesseract from 'tesseract.js'
import XLSX from 'xlsx'
const loading = ref(false)
const src = ref('https://i.hzmbus.com/webh5api/captcha')
const index = ref(1)
const tableData = ref([])
const pagination = ref({
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
})
const state = reactive({
  tableData: [],
})
const exportExcelName = ref('')
const columns = [
  {
    title: '账户',
    dataIndex: 'username',
  },
  {
    title: '密码',
    dataIndex: 'password',
  },
  {
    title: '邮件',
    dataIndex: 'email',
  },
  {
    title: '状态',
    dataIndex: 'status',
    slots: { customRender: 'status' },
  },
  {
    title: '操作',
    dataIndex: 'action',
    slots: { customRender: 'action' },
  }
]
//#region

const handleQueryTableData = (current, pageSize) => {
  loading.value = true

}

//  mock 数据id随机，页面效果不会双向绑定checkbox，但是实际开发不会存在该问题
const onSelectChange = (keys) => {
  selectedRowKeys.value = keys
}
const handleTableChange = ({ current, pageSize }) => {
  handleQueryTableData(current, pageSize)
}
const onAddTableItem = () => {
  const { current, pageSize } = unref(pagination)
  handleQueryTableData(current, pageSize)
}

const visible = ref(false)
// let updateData = reactive({})
let updateData = ref({})
const handleUpdate = (record) => {
  visible.value = true
  updateData.value = record
}
const onUpdateTableItem = () => {
  // console.log(2)
  visible.value = false
  const { current, pageSize } = unref(pagination)
  handleQueryTableData(current, pageSize)
}

const onSearch = (val) => {
  console.log('搜索得内容是', val)
}
const handleDelete = (id) => {
  console.log(id)
}

const edit = (id) => {
  editableData[id] = tableData.value.filter((item) => id === item.id)[0]
  console.log(editableData)
}

const save = (id) => {
  // 想后台发送更新请求
  loading.value = true
  setTimeout(() => {
    Object.assign(tableData.value.filter((item) => id === item.id)[0], editableData[id])
    delete editableData[id]
    loading.value = false
    message.info('更改成功')
  }, 500)
}

//#endregion

const readFile = async (e) => {
  var files = e.target.files;
  var reader = await new FileReader();
  reader.readAsBinaryString(files[0]);
  reader.onload = function (ev) {
    try {
      var data = ev.target.result,
        workbook = XLSX.read(data, {
          type: 'binary'
        }), // 以二进制流方式读取得到整份excel表格对象
        persons = []; // 存储获取到的数据
    } catch (e) {
      console.log('文件类型不正确');
      return;
    }

    var fromTo = '';
    // 遍历每张表读取
    for (var sheet in workbook.Sheets) {
      if (workbook.Sheets.hasOwnProperty(sheet)) {
        fromTo = workbook.Sheets[sheet]['!ref'];
        persons = persons.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
        // break; // 如果只取第一张表，就取消注释这行
      }
    }

    state.tableData = persons
    console.log(state.tableData);
  };


}
const Start = async () => {
  await state.tableData.forEach((item, index) => {
    item.headers = {
      Cookie: 'acw_tc=2f6a1f9316668360349254398e7ae59992564afe037082d5d8185ba5a062bc; acw_sc__v2=6359e642adeb73f27096ccdc1d7fcb0830201a5d; Hm_lvt_ecfd5c356fd652f819555c3c77fd1626=1666313190,1666602351,1666771732,1666836037; Hm_lpvt_ecfd5c356fd652f819555c3c77fd1626=1666836037; PHPSESSID=dg24tg3d8q7r9hpjsqcc8h97dv'
    }
    login(item).then(res => {
      item.headers.Authorization = res.data.jwt
    })
  }
  )
  console.log(state.tableData);
}
const handleExportExcel = () => {
  const header = ['username', 'password', 'email', 'status']
  const data = state.tableData.map((item) => [item.username, item.password, item.email, item.status])
  import('@/plugins/Export2Excel').then(({ arrayToExcel }) => {
    arrayToExcel({ header, data, fileName: 'excel-test' })
  })
}
const getVerifyCode = (e) => {
  document.cookie = "name=1 ;yer=2"
  console.log(document.cookie);
  // window.open('https://i.hzmbus.com/webh5api/captcha')
  // e.target.src = 'https://i.hzmbus.com/webh5api/captcha?' + index.value
  // index.value++
  // axios.get('https://i.hzmbus.com/webh5api/captcha', { responseType: 'arraybuffer' }).then((res) => {

  // });
  // getCaptch().then(res=>{
  //   console.log(res);
  // })  
}


onMounted(() => {
  const { current, pageSize } = unref(pagination)
  handleQueryTableData(current, pageSize)
  // queryTable().then(res => {
  //   console.log(res);
  // })

})
</script>

<style lang="scss" scope>
.editable-cell {
  position: relative;

  .editable-cell-input-wrapper,
  .editable-cell-text-wrapper {
    padding-right: 24px;
  }

  .editable-cell-text-wrapper {
    padding: 5px 24px 5px 5px;
  }

  .editable-cell-icon,
  .editable-cell-icon-check {
    position: absolute;
    right: 0;
    width: 20px;
    cursor: pointer;
  }

  .editable-cell-icon {
    margin-top: 4px;
    display: none;
  }

  .editable-cell-icon-check {
    line-height: 28px;
  }

  .editable-cell-icon:hover,
  .editable-cell-icon-check:hover {
    color: #108ee9;
  }

  .editable-add-btn {
    margin-bottom: 8px;
  }
}

.editable-cell:hover .editable-cell-icon {
  display: inline-block;
}
</style>
