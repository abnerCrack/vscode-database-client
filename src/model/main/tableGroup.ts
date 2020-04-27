import * as path from "path";
import * as vscode from "vscode";
import { QueryUnit } from "../../service/queryUnit";
import { InfoNode } from "../other/infoNode";
import { Node } from "../interface/node";
import { DatabaseCache } from "../../service/common/databaseCache";
import { ConnectionManager } from "../../service/connectionManager";
import { TableNode } from "./tableNode";
import { Constants, ModelType, Template } from "../../common/constants";

export class TableGroup extends Node {

    public iconPath: string = path.join(Constants.RES_PATH, "icon/table.svg");
    public contextValue: string = ModelType.TABLE_GROUP;
    constructor(readonly info: Node) {
        super("TABLE")
        this.id = `${info.getConnectId()}_${info.database}_${ModelType.TABLE_GROUP}`;
        this.init(info)
    }

    public async getChildren(isRresh: boolean = false): Promise<Node[]> {

        let tableNodes = DatabaseCache.getTableListOfDatabase(this.id);
        if (tableNodes && !isRresh) {
            return tableNodes;
        }
        return QueryUnit.queryPromise<any[]>(await ConnectionManager.getConnection(this),
            `SELECT table_comment comment,TABLE_NAME tableName FROM information_schema.TABLES  WHERE TABLE_SCHEMA = '${this.database}' and TABLE_TYPE<>'VIEW' order by table_name LIMIT ${QueryUnit.maxTableCount} ;`)
            .then((tables) => {
                tableNodes = tables.map<TableNode>((table) => {
                    return new TableNode(table.tableName, table.comment, this.info);
                });
                DatabaseCache.setTableListOfDatabase(this.id, tableNodes);
                if (tableNodes.length == 0) {
                    return [new InfoNode("This database has no table")];
                }
                return tableNodes;
            })
            .catch((err) => {
                return [new InfoNode(err)];
            });
    }

    public createTemplate() {
        ConnectionManager.getConnection(this, true);
        QueryUnit.showSQLTextDocument(`CREATE TABLE tableName(  
  id int NOT NULL primary key AUTO_INCREMENT,
  column varchar(length)
);`, Template.create);
    }
}