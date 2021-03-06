import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import mt from 'moment-timezone';
import 'moment/locale/zh-cn';
import router from 'umi/router';
import { formatMessage, FormattedMessage } from 'umi-plugin-react/locale';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Select,
  Icon,
  Button,
  Dropdown,
  Menu,
  InputNumber,
  DatePicker,
  Modal,
  message,
  Badge,
  Divider,
  Steps,
  Radio,
  Collapse,
  Checkbox,
} from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

const { RangePicker } = DatePicker;
const FormItem = Form.Item;
const Panel = Collapse.Panel;
const CheckboxGroup = Checkbox.Group;

/* eslint react/no-multi-comp:0 */
@connect(({ roles, loading }) => ({
  roles,
  loading: loading.models.roles,
}))
@Form.create()
class CreateRole extends PureComponent {
  state = {
    formValues: {},
    indeterminate: true,
    checkAll: false,
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'roles/template',
    });
  }

  handleBackClick = () => {
    router.push(`/setting-center/role-index`);
  };

  handleAdd = fields => {
    const { dispatch } = this.props;
    dispatch({
      type: 'roles/add',
      payload: {
        desc: fields.desc,
      },
    });

    message.success('添加成功');
    this.handleBackClick();
  };

  handleSubmit = e => {
    const { dispatch, form, roles:{ selectedPermissions } } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        dispatch({
          type: 'roles/add',
          payload: {
            name: values.name,
            desc: values.desc,
            permissions: selectedPermissions,
          },
        });
        message.success('添加成功');
        this.handleBackClick();
      }
    });
  };

  callback(key) {
    console.log(key);
  }

  onChange = (module, items, checkedList) => {
    const { dispatch, roles: { selectedPermissions }, } = this.props;
    const modulePermissions = {};
    if(checkedList.length > 0){
      modulePermissions[module] = checkedList;
    }else{
      delete selectedPermissions[module];
    }

    const newPermissions = {...selectedPermissions, ...modulePermissions};
    dispatch({
      type: 'roles/changePermission',
      payload: newPermissions
    });

  };

  onCheckAllChange = (module, items, e) => {
    const { dispatch, roles: { selectedPermissions }, } = this.props;
    const allValues = items.map(item => item.value);
    const modulePermissions = {};
    if(e.target.checked){
      modulePermissions[module] = allValues;
    }else{
      delete selectedPermissions[module];
    }
    // modulePermissions[module] = e.target.checked ? allValues : [];
    const newPermissions = {...selectedPermissions, ...modulePermissions};
    dispatch({
      type: 'roles/changePermission',
      payload: newPermissions
    });
  };

  render() {
    const {
      roles: { data, selectedPermissions },
      loading,
      form,
    } = this.props;
    console.log(data);
    const {  } = this.state;
    const { getFieldDecorator } = form;

    const formItemLayout = {
      labelCol: {
        xs: { span: 4 },
        sm: { span: 2 },
      },
      wrapperCol: {
        xs: { span: 18 },
        sm: { span: 20 },
      },
    };

    const submitFormLayout = {
      wrapperCol: {
        xs: { span: 24, offset: 4 },
        sm: { span: 10, offset: 2 },
      },
    };
    // const { selectedRows, modalVisible, updateModalVisible, stepFormValues } = this.state;
    const text = `
      A dog is a type of domesticated animal.
      Known for its loyalty and faithfulness,
      it can be found as a welcome guest in many households across the world.
    `;
    const permissions = data.items || [];
    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <Form {...formItemLayout} onSubmit={this.handleSubmit}>
            <Row>
              <FormItem label="角色名称">
                {getFieldDecorator('name', {
                  rules: [
                    {
                      required: true,
                      message: '请填写角色名称!',
                    },
                  ],
                })(<Input />)}
              </FormItem>
            </Row>
            <Row>
              <FormItem label="角色描述">
                {getFieldDecorator('desc', {
                  rules: [],
                })(<Input />)}
              </FormItem>
            </Row>
            <Row>
              <FormItem label="角色权限">
                {permissions.map((item, index) => (
                  <Collapse onChange={this.callback} key={item.name}>
                    <Panel header={item.name} key={item.name}>
                      {item.module_permissions.map((item, i) => (
                        <Row key={item.module}>
                          <Col span={8}>
                            <Checkbox
                              //indeterminate={this.state.indeterminate}
                              onChange={this.onCheckAllChange.bind(this, item.module, item.permissions)}

                            >
                              {item.module_name}
                            </Checkbox>
                          </Col>
                          <Col span={16}>
                            {/* {item.permissions &&
                              item.permissions.map((checkbox, index) => (
                                <Checkbox
                                  key={index}
                                  //indeterminate={this.state.indeterminate}
                                  onChange={this.onChange}
                                  // checked={!checkbox.disable}
                                >
                                  {checkbox.name}
                                </Checkbox>
                              ))} */}
                            <CheckboxGroup
                              options={item.permissions}
                              value={selectedPermissions[item.module]}
                              onChange={this.onChange.bind(this, item.module, item.permissions)}
                            />
                          </Col>
                        </Row>
                      ))}
                    </Panel>
                  </Collapse>
                ))}
              </FormItem>
            </Row>
            <Row>
              <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
                <Button type="primary" htmlType="submit" loading={loading}>
                  <FormattedMessage id="form.save" />
                </Button>
                <Button style={{ marginLeft: 8 }} onClick={this.handleBackClick}>
                  <FormattedMessage id="form.back" />
                </Button>
              </FormItem>
            </Row>
          </Form>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default CreateRole;
