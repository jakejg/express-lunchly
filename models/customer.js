/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** get first and last name for this customer. */
  getFullName() {
    return this.firstName + " " + this.lastName;
  }

  /** get customers by name*/
  static async getByName(firstName, lastName) {
    let results;
    if (lastName === undefined){
      results = await db.query(
        `SELECT id, 
           first_name AS "firstName",  
           last_name AS "lastName", 
           phone, 
           notes 
          FROM customers 
          WHERE first_name=$1
          OR last_name=$1`,
        [firstName]
      );
    }
    else {
      results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers 
        WHERE first_name=$1
        AND last_name=$2`,
      [firstName, lastName]
      );
    }
    const customers = results.rows.map(row => {
      return new Customer(row);
    });
    
    return customers;
  }

    /** Get the 10 customers that have made the most reservations. */
  static async mostReservations() {
    const results = await db.query(`
    SELECT c.id, 
    c.first_name AS "firstName",
    c.last_name AS "lastName", c.phone, c.notes,
    COUNT(customer_id)
    FROM customers as c JOIN reservations as r ON
    c.id = r.customer_id
    GROUP BY c.id
    ORDER BY COUNT(customer_id) DESC
    LIMIT 10`)
    const customers = results.rows.map(row => {
      const c = new Customer(row);
      c.numRes = row.count;
      return c
    });
    
    return customers;
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }
}

module.exports = Customer;
