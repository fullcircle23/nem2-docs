:orphan:

.. post:: 16 Jan, 2019
    :category: Transfer Transaction, Monitoring
    :excerpt: 1
    :nocomments:

###############################
Monitoring a transaction status
###############################

Make sure a transaction gets included in the blockchain after being announced.

**********
Background
**********

After calling an API method that changes a database state, the application usually receives a response informing if the change has been applied or failed due to some constraints.

When working with blockchain technology, it is interesting to **fire the transaction**, let the node process it, and **receive a notification** if it succeeded or failed. Differently, from a traditional database, the average confirmation time of modification is higher, passing from milliseconds to seconds, or even minutes in the worst cases.

In this guide, you are going to learn how to verify that your transaction has been **recorded permanently** before executing any other critical action.

*************
Prerequisites
*************

- Finish the :doc:`getting started section <../../getting-started/setup-workstation>`

**********************
Getting into some code
**********************

Catapult enables an **asynchronous transaction announcement**. After an application publishes a transaction, the API node will always accept it if it is well-formed.

At this time, the server does not ensure that the transaction is valid. For example, you might not have the number of asset units you want to need to send and still, get a positive response from the server. For this reason, the "OK" response does not guarantee getting the transaction included in a block. To make sure the transaction is added in a block, you must track the :doc:`transaction status <../../concepts/transaction>` using **Listeners**.

`Listeners <websockets>`_ enable receiving notifications possible when a change in the blockchain occurs. The notification is received in real-time without having to poll the API waiting for a reply.

Let's see how transaction monitorization works transferring a **TransferTransaction**.

1. Define the transaction you want to announce. In this case, we are going to send the message ``Test`` to ``SD5DT3-CH4BLA-BL5HIM-EKP2TA-PUKF4N-Y3L5HR-IR54``.

.. example-code::

    .. viewsource:: ../../resources/examples/typescript/transaction/MonitoringTransactionStatus.ts
        :language: typescript
        :start-after:  /* start block 01 */
        :end-before: /* end block 01 */

2. Sign the transaction with your account.

.. note:: To make the transaction only valid for your network, include the first block generation hash. Open ``http://localhost:3000/block/1`` in a new tab and copy the ``meta.generationHash`` value.

.. example-code::

    .. viewsource:: ../../resources/examples/typescript/transaction/MonitoringTransactionStatus.ts
        :language: typescript
        :start-after:  /* start block 02 */
        :end-before: /* end block 02 */


3. Open a new :ref:`Listener <websockets>`. The listener communicates with the API WebSocket, which forward you asynchronously the status of the transaction.

.. example-code::

    .. viewsource:: ../../resources/examples/typescript/transaction/MonitoringTransactionStatus.ts
        :language: typescript
        :start-after:  /* start block 03 */
        :end-before: /* end block 03 */

4. Monitor if the WebSocket **connection is alive**. :doc:`Blocks <../../concepts/block>` are generated every ``15`` seconds in average, so a timeout can be raised if there is no response after 30 seconds approximately.

.. example-code::

    .. viewsource:: ../../resources/examples/typescript/transaction/MonitoringTransactionStatus.ts
        :language: typescript
        :start-after:  /* start block 04 */
        :end-before: /* end block 04 */

    .. viewsource:: ../../resources/examples/bash/blockchain/ListeningNewBlocks.sh
        :language: bash
        :start-after: #!/bin/sh

5. Monitor if there is some **validation error** with the transaction issued. When you receive a message from status WebSocket channel, it always means **the transaction did not meet the requirements**. You need to handle the error accordingly, by reviewing the :ref:`error status list <status-errors>`.

.. example-code::

    .. viewsource:: ../../resources/examples/typescript/transaction/MonitoringTransactionStatus.ts
        :language: typescript
        :start-after:  /* start block 05 */
        :end-before: /* end block 05 */

    .. viewsource:: ../../resources/examples/bash/transaction/MonitoringTransactionStatusError.sh
        :language: bash
        :start-after: #!/bin/sh

6. Monitor as well if the transaction **reaches the network**. When you receive a message from **unconfirmed WebSocket channel**, the transaction is valid and is waiting to be included in a block. This does not mean necessarily that the transaction will be included, as a second validation happens before being finally confirmed.

.. example-code::

    .. viewsource:: ../../resources/examples/typescript/transaction/MonitoringTransactionStatus.ts
        :language: typescript
        :start-after:  /* start block 06 */
        :end-before: /* end block 06 */

    .. viewsource:: ../../resources/examples/bash/transaction/MonitoringTransactionUnconfirmed.sh
        :language: bash
        :start-after: #!/bin/sh

7. Monitor when the transaction gets **included in a block**. When included, transaction can still be :doc:`rolled-back <../../concepts/transaction>` because of forks. You can decide for yourself that after e.g. 6 blocks the `transaction is secured <https://gist.github.com/aleixmorgadas/3d856d318e60f901be09dbd23467b374>`_.

.. example-code::

    .. viewsource:: ../../resources/examples/typescript/transaction/MonitoringTransactionStatus.ts
        :language: typescript
        :start-after:  /* start block 07 */
        :end-before: /* end block 07 */

    .. viewsource:: ../../resources/examples/bash/transaction/MonitoringTransactionConfirmed.sh
        :language: bash
        :start-after: #!/bin/sh

8.  Finally, announce the transaction to the network.

.. example-code::

    .. viewsource:: ../../resources/examples/typescript/transaction/MonitoringTransactionStatus.ts
        :language: typescript
        :start-after:  /* start block 08 */
        :end-before: /* end block 08 */

    .. viewsource:: ../../resources/examples/bash/transaction/SendingATransferTransaction.sh
        :language: bash
        :start-after: #!/bin/sh

If you missed the WebSocket response, check the transaction status after by calling the `transaction status <https://nemtech.github.io/endpoints.html#operation/getTransactionStatus>`_ endpoint. The status of failed transactions is not persistent, meaning that eventually is pruned.

.. note:: If you are developing a small application, and monitoring asynchronous transactions adds too much overhead to your project, consider :doc:`turning asynchronous transactions announcement into synchronous <turning-the-asynchronous-transaction-announcement-into-synchronous>`.

.. _monitoring-transactions-client-side:

************************************************************
Troubleshooting: Monitoring transactions on the client side
************************************************************

The NEM2-SDK for typescript base Listener was designed to work on Node.js backend environments.
To make the code work in the client side (e.g., Angular, React, Vue.), pass the browser implementation of the WebSocket to the Listener.

.. code-block:: typescript

  const listener = new Listener('ws://localhost:3000', WebSocket);
  listener.open().then(() => ...
