import Fetch from 'cross-fetch';
var FormData = require('form-data');

const infuraUrl = "https://ipfs.infura.io:5001/api/v0/";

export default () => {

  const storeOnIPFS = async (data: string) => {
    const formData = new FormData();
    formData.append("data", data);

    return (await Fetch(`${infuraUrl}add`, {
      method: 'POST',
      body: formData,
    })).json()
  }

  return {
    storeOnIPFS
  }
}