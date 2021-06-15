const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "todoApplication.db");

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is Running at port 3000");
    });
  } catch (e) {
    process.exit(1);
    console.log(`DB error : ${e.message}`);
  }
};

initializeDBAndServer();

const hasStatus = (request) => {
  return request.status !== undefined;
};

const hasPriority = (request) => {
  return request.priority !== undefined;
};

const hasPriorityAndStatus = (request) => {
  return request.priority !== undefined && request.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let getTodoQuery;
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasStatus(request.query):
      getTodoQuery = `
                SELECT *
                FROM 
                   todo  
                WHERE 
                  todo LIKE '%${search_q}%'
                  AND status = '${status}';`;
      break;
    case hasPriority(request.query):
      getTodoQuery = `
                SELECT *
                FROM 
                   todo 
                WHERE 
                  todo LIKE '%${search_q}%'
                  AND priority = '${priority}';`;
      break;
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `
                SELECT *
                FROM 
                   todo 
                WHERE 
                  todo LIKE '%${search_q}%'
                  AND status = '${status}'
                  AND priority = '${priority}';`;
      break;
    default:
      getTodoQuery = `
                SELECT *
                FROM 
                   todo 
                WHERE 
                  todo LIKE '%${search_q}%';`;
  }
  const data = await database.all(getTodoQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT *
        FROM todo
        WHERE id = ${todoId};`;
  const data = await database.get(getTodoQuery);
  response.send(data);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createQuery = `
        INSERT INTO todo (id ,todo,priority,status)
        VALUES (${id},'${todo}','${priority}','${status}');`;
  await database.run(createQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
