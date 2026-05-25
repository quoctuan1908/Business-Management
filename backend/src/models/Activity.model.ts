import { isNonEmptyString, isString, isUnsignedInteger } from 'jet-validators';

import { parseObject, Schema, testObject } from 'jet-validators/utils';



import { transformIsDate } from '@src/common/utils/validators';

import { Entity } from './common/types';



/******************************************************************************

                                 Constants

******************************************************************************/



const GetDefaults = (): IActivity => ({

  id: 0,

  userId: 0,

  customerId: 0,

  invoiceId: null,

  status: 'draft',

  activityDate: new Date(),

  content: '',

  createdAt: new Date(),

  updatedAt: new Date(),

});



const schema: Schema<IActivity> = {

  id: isUnsignedInteger,

  userId: isUnsignedInteger,

  customerId: isUnsignedInteger,

  status: isString,

  activityDate: transformIsDate,

  content: isString,

};



const writeSchema: Schema<IActivityWrite> = {

  userId: isUnsignedInteger,

  customerId: isUnsignedInteger,

  activityDate: transformIsDate,

  content: isString,

};



/******************************************************************************

                                  Types

******************************************************************************/



/**

 * @entity activities

 */

export interface IActivity extends Entity {

  userId: number;

  customerId: number;

  invoiceId: number | null;

  status: string;

  activityDate: Date;

  content: string;

}



export interface IActivityWrite {

  userId: number;

  customerId: number;

  activityDate: Date;

  content: string;

}



/******************************************************************************

                                  Setup

******************************************************************************/



const parseActivity = parseObject<IActivity>(schema);



const isCompleteActivityWrite = testObject<IActivityWrite>({

  ...writeSchema,

  userId: isUnsignedInteger,

  customerId: isUnsignedInteger,

  content: isNonEmptyString,

});



const isCompleteActivityUpdate = testObject<IActivity>({

  ...schema,

  id: isUnsignedInteger,

  userId: isUnsignedInteger,

  customerId: isUnsignedInteger,

  content: isNonEmptyString,

});



/******************************************************************************

                                 Functions

******************************************************************************/



function new_(activity?: Partial<IActivity>): IActivity {

  return parseActivity({ ...GetDefaults(), ...activity }, (errors) => {

    throw new Error(

      'Setup new activity failed ' + JSON.stringify(errors, null, 2),

    );

  });

}



/******************************************************************************

                                Export default

******************************************************************************/



export default {

  new: new_,

  isCompleteWrite: isCompleteActivityWrite,

  isCompleteUpdate: isCompleteActivityUpdate,

} as const;

