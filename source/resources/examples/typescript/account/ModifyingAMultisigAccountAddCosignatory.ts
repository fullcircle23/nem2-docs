/*
 *
 * Copyright 2018-present NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import {
    Account,
    AggregateTransaction,
    Deadline,
    HashLockTransaction,
    Listener,
    ModifyMultisigAccountTransaction,
    MultisigCosignatoryModification,
    MultisigCosignatoryModificationType,
    NetworkCurrencyMosaic,
    NetworkType,
    PublicAccount,
    TransactionHttp,
    UInt64
} from "nem2-sdk";
import {filter, mergeMap} from 'rxjs/operators';

/* start block 01 */
const nodeUrl = 'http://localhost:3000';
const transactionHttp = new TransactionHttp(nodeUrl);
const listener = new Listener(nodeUrl);

const cosignatoryPrivateKey = process.env.COSIGNATORY_PRIVATE_KEY as string;
const cosignatoryAccount = Account.createFromPrivateKey(cosignatoryPrivateKey, NetworkType.MIJIN_TEST);

const multisigAccountPublicKey = process.env.MULTISIG_ACCOUNT_PUBLIC_KEY as string;
const multisigAccount = PublicAccount.createFromPublicKey(multisigAccountPublicKey, NetworkType.MIJIN_TEST);

const newCosignatoryPublicKey = process.env.NEW_COSIGNATORY_PUBLIC_KEY as string;
const newCosignatoryAccount = PublicAccount.createFromPublicKey(newCosignatoryPublicKey, NetworkType.MIJIN_TEST);

const multisigCosignatoryModification = new MultisigCosignatoryModification(MultisigCosignatoryModificationType.Add, newCosignatoryAccount);
/* end block 01 */

/* start block 02 */
const modifyMultisigAccountTransaction = ModifyMultisigAccountTransaction.create(
    Deadline.create(),
    0,
    0,
    [multisigCosignatoryModification],
    NetworkType.MIJIN_TEST);
/* end block 02 */

/* start block 03 */
const aggregateTransaction = AggregateTransaction.createBonded(
    Deadline.create(),
    [modifyMultisigAccountTransaction.toAggregate(multisigAccount)],
    NetworkType.MIJIN_TEST);

const networkGenerationHash = process.env.NETWORK_GENERATION_HASH as string;
const signedTransaction = cosignatoryAccount.sign(aggregateTransaction, networkGenerationHash);
console.log(signedTransaction.hash);
/* end block 03 */

/* start block 04 */
const hashLockTransaction = HashLockTransaction.create(
    Deadline.create(),
    NetworkCurrencyMosaic.createRelative(10),
    UInt64.fromUint(480),
    signedTransaction,
    NetworkType.MIJIN_TEST);

const hashLockTransactionSigned = cosignatoryAccount.sign(hashLockTransaction, networkGenerationHash);

listener.open().then(() => {

    transactionHttp
        .announce(hashLockTransactionSigned)
        .subscribe(x => console.log(x), err => console.error(err));

    listener
        .confirmed(cosignatoryAccount.address)
        .pipe(
            filter((transaction) => transaction.transactionInfo !== undefined
                && transaction.transactionInfo.hash === hashLockTransactionSigned.hash),
            mergeMap(ignored => transactionHttp.announceAggregateBonded(signedTransaction))
        )
        .subscribe(announcedAggregateBonded => console.log(announcedAggregateBonded),
            err => console.error(err));
});
/* end block 04 */
