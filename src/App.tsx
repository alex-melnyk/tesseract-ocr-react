import * as React from 'react';
import { useCallback } from 'react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';

const cameraSize = {
  width: 640,
  height: 480
};

const readableArea = {
  left: 160,
  top: 160,
  width: 320,
  height: 160
};

const App: React.FC = () => {
  const webcamRef = React.useRef<Webcam>(null);

  const [result, setResult] = React.useState<string>();
  const [isReady, setIsReady] = React.useState(false);
  const [timerId, setTimerId] = React.useState<NodeJS.Timeout>();
  const [tesseractScheduler, setTesseractScheduler] = React.useState<Tesseract.Scheduler>();

  React.useEffect(() => {
    if (!!webcamRef.current) {
      const {
        createWorker,
        createScheduler
      } = Tesseract;

      const scheduler = createScheduler();

      const addingWorkers = [...new Array(5)].map(() => new Promise(async (resolve) => {
        const worker = createWorker();
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        scheduler.addWorker(worker);

        resolve();
      }));

      Promise.all(addingWorkers)
        .then(() => setTesseractScheduler(scheduler));

      return () => {
        setTesseractScheduler(undefined);
        scheduler.terminate();
      };
    }
  }, [webcamRef]);

  React.useEffect(() => {
    if (!!tesseractScheduler && !!webcamRef.current) {
      setIsReady(true);
    }
  }, [tesseractScheduler]);

  const recognition = useCallback(async () => {
    if (!tesseractScheduler) {
      return;
    }

    const canvas = webcamRef.current?.getCanvas();

    const {
      data: {
        text
      }
    } = await tesseractScheduler.addJob('recognize', canvas, {
      rectangle: readableArea
    });

    setResult(text);
  }, [tesseractScheduler]);

  const handleStartStopClick = useCallback(() => {
    if (!timerId) {
      setTimerId(setInterval(recognition, 1000));
    } else {
      clearInterval(timerId);
      setTimerId(undefined);
    }
  }, [timerId, tesseractScheduler, webcamRef]);

  return (
    <div className="App">
      <div
        style={{
          display: 'flex',
          flex: 1,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: cameraSize.width,
            height: cameraSize.height,
          }}
        >
          <Webcam
            // @ts-ignore
            ref={webcamRef}
            audio={false}
            width={cameraSize.width}
            height={cameraSize.height}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: cameraSize.width,
              height: cameraSize.height,
              facingMode: "user"
            }}
            style={{
              flex: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: readableArea.width,
              height: readableArea.height,
              // backgroundColor: 'red',
              borderColor: '#000000AA',
              borderStyle: 'solid',
              borderLeftWidth: readableArea.left,
              borderTopWidth: readableArea.top,
              borderRightWidth: cameraSize.width - (readableArea.left + readableArea.width),
              borderBottomWidth: cameraSize.height - (readableArea.top + readableArea.height),
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#EFEFEF'
          }}
        >
          <span>
            {result}
          </span>
        </div>
      </div>
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <button
          disabled={!isReady}
          onClick={handleStartStopClick}
        >
          {!!timerId ? 'STOP' : 'START'}
        </button>
      </div>
    </div>
  );
}

export default App;
