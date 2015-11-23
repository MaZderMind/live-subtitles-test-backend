import { addError } from '../Services/notifications';
import { changePassword } from '../Services/user';
import { TextField, RaisedButton } from 'material-ui';
import React from 'react';

export default class Profile extends React.Component {
  changePassword = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { oldpw, newpw1, newpw2 } = this.refs;
    const pw1 = newpw1.getValue();
    const pw2 = newpw2.getValue();
    if (pw1 !== pw2) {
      addError({ message: 'Passwords did not match' });
      return;
    }
    const opw = oldpw.getValue();
    changePassword(opw, pw1);
    oldpw.setValue('');
    newpw1.setValue('');
    newpw2.setValue('');
  };
  render() {
    return (
      <div>
        <h2>Change Password</h2>
        <form onSubmit={this.changePassword}>
          <TextField floatingLabelText="Current Password" type="password" ref="oldpw"/>
          <TextField floatingLabelText="New Password" ref="newpw1" type="password"/>
          <TextField floatingLabelText="Password Confirmation" ref="newpw2" type="password"/>
          <RaisedButton type="submit" label="Change" primary onClick={this.changePassword}/>
        </form>
      </div>
    );
  }
}