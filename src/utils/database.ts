import rfdc from 'rfdc';
import { diff } from 'deep-diff';
import AWS from 'aws-sdk';

const TABLE_NAME = 'affiliate-boxy-users';
const clone = rfdc();

class Database {
    private _DynamoDB?: AWS.DynamoDB.DocumentClient;
    private username?: string;
    private cloudData?: { [key: string]: any };
    public data!: { [key: string]: any };

    get DynamoDB() {
        if (!this._DynamoDB) this._DynamoDB = new AWS.DynamoDB.DocumentClient();
        return this._DynamoDB;
    }

    async loadData(username: string) {
        this.username = username;
        const params = {
            TableName: TABLE_NAME,
            Key: { id: this.username }
        };
        this.data = (await this.DynamoDB.get(params).promise()).Item!;
        if (this.data === undefined) this.data = await this.createEntry();
        this.cloudData = clone(this.data);
    }

    async createEntry() {
        const entry = {
            sites: {}
            //Default object for new user data
        };

        const params = {
            TableName: TABLE_NAME,
            Item: { id: this.username, ...entry }
        };
        return await this.DynamoDB.put(params).promise();
    }

    async commit() {
        const differences = diff(this.cloudData, this.data);
        if (differences === undefined) return;

        let setExpression = '';
        let removeExpression = '';
        let attributeNames = {};
        let attributeValues = {};
        for (const difference of differences) {
            if (!difference.path) throw new Error('Cannot commit undefined or null data');
            if (difference.kind === 'N' || difference.kind === 'E') {
                setExpression = this.setPath(difference.path, setExpression, attributeNames);
                const value = this.setValue(difference.rhs, attributeValues);
                setExpression = `${setExpression} = ${value}, `;
            } else if (difference.kind === 'D') {
                removeExpression = this.setPath(difference.path, removeExpression, attributeNames);
                removeExpression = `${removeExpression}, `;
            } else if (difference.kind === 'A') {
                if (difference.item.kind === 'N') {
                    setExpression = this.setPath(difference.path, setExpression, attributeNames);
                    const value = this.setValue(difference.item.rhs, attributeValues);
                    setExpression = `${setExpression}[${difference.index}] = ${value}, `;
                } else if (difference.item.kind === 'D') {
                    removeExpression = this.setPath(difference.path, removeExpression, attributeNames);
                    removeExpression = `${removeExpression}[${difference.index}], `;
                }
            }
        }

        let updateExpression = ''
        if (setExpression.length > 0)
            updateExpression += `SET ${setExpression.slice(0, -2)} `;
        if (removeExpression.length > 0)
            updateExpression += `REMOVE ${removeExpression.slice(0, -2)} `;

        if (updateExpression.length > 0) {
            updateExpression = updateExpression.slice(0, -1);
            const params: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
                TableName: TABLE_NAME,
                Key: { id: this.username },
                UpdateExpression: updateExpression,
                ExpressionAttributeNames: attributeNames
            }
            if (Object.keys(attributeValues).length)
                params.ExpressionAttributeValues = attributeValues;
            return await this.DynamoDB.update(params).promise();
        }
    }

    setPath(paths: string[], expression: string, names: { [key: string]: string }) {
        let firstPath = true;
        for (const path of paths) {
            if (typeof path === 'number')
                expression += `[${path}]`
            else {
                if (firstPath) firstPath = false;
                else expression += '.';
                expression += this.setName(path, names);
            }
        }
        return expression;
    }

    setName(name: string, names: { [key: string]: string }) {
        const keys = Object.keys(names);
        let _name = keys.find((key) => names[key] === name);
        if (_name === undefined) {
            _name = `#${keys.length + 1}`;
            names[_name] = name;
        }
        return _name;
    }

    setValue(value: any, values: { [key: string]: any }) {
        const keys = Object.keys(values);
        const _value = `:${keys.length + 1}`;
        values[_value] = value;
        return _value;
    }
}
export default new Database();