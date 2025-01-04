import React, { useState } from 'react';
import { Card, CardContent, CardHeader, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import Papa from 'papaparse';

const ActivityUploadApp = () => {
  const [formData, setFormData] = useState({
    endpoint: 'https://api2.netcoresmartech.com/v1/activity/upload',
    apiKey: '',
    assetId: '',
    identity: '',
    activitySource: 'web',
     accessToken: ''
  });
  const [csvData, setCsvData] = useState(null);
  const [apiCurl, setApiCurl] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSourceChange = (e) => {
    setFormData({
      ...formData,
      activitySource: e.target.value
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setCsvData(results.data);
      }
    });
  };

  const generateSampleValue = (dataType) => {
    switch(dataType.toLowerCase()) {
      case 'text':
        return "Sample Text";
      case 'integer':
        return 42;
      case 'float':
        return 42.5;
      case 'date':
        const now = new Date();
        return now.toISOString().split('.')[0].replace('T', ' ');
      default:
        return "Sample Value";
    }
  };

  const generateRequestBody = () => {
    if (!csvData) return [];

    const events = [];
    let currentEventName = null;
    let currentEventParams = {};

    csvData.forEach((row) => {
      if (row.eventName) {
        if (currentEventName) {
          // Push the previous event into the events array
          events.push({
            asset_id: formData.assetId,
            activity_name: currentEventName,
            timestamp: new Date().toISOString().split('.')[0],
            identity: formData.identity,
            activity_source: formData.activitySource,
            activity_params: currentEventParams
          });
        }
        // Start a new event
        currentEventName = row.eventName;
        currentEventParams = {};
      }

      if (row.eventPayload) {
        if (row.eventPayload.includes('items[].')) {
          if (!currentEventParams.items) currentEventParams.items = [{}];
          const itemField = row.eventPayload.split('items[].')[1];
          currentEventParams.items[0][itemField] = generateSampleValue(row.dataType);
        } else {
          currentEventParams[row.eventPayload] = generateSampleValue(row.dataType);
        }
      }
    });

    // Push the last event
    if (currentEventName) {
      events.push({
        asset_id: formData.assetId,
        activity_name: currentEventName,
        timestamp: new Date().toISOString().split('.')[0],
        identity: formData.identity,
        activity_source: formData.activitySource,
        activity_params: currentEventParams
      });
    }

    return events;
  };

  const generateCurl = () => {
    const requestBody = generateRequestBody();
    const curl = `curl --location --request POST '${formData.endpoint}' \\
--header 'Authorization: Bearer ${formData.apiKey}' \\
--header 'Access-Token: ${formData.accessToken}' \\
--header 'Content-Type: application/json' \\
--data '${JSON.stringify(requestBody, null, 2)}'`;

    setApiCurl(curl);
    setShowConfirmation(true);
  };

  const handleSubmit = () => {
    console.log('Submitting with body:', generateRequestBody());
  };

  return (
    <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <CardHeader title="Activity Upload Form" />
        <CardContent>
          <TextField
            label="Endpoint"
            name="endpoint"
            value={formData.endpoint}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="API Key"
            name="apiKey"
            type="password"
            value={formData.apiKey}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Access Token"
            name="accessToken"
            type="password"
            value={formData.accessToken}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Asset ID"
            name="assetId"
            value={formData.assetId}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Identity"
            name="identity"
            value={formData.identity}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Activity Source</InputLabel>
            <Select
              value={formData.activitySource}
              onChange={handleSourceChange}
            >
              <MenuItem value="web">Web</MenuItem>
              <MenuItem value="app">App</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            component="label"
            style={{ marginTop: '16px' }}
          >
            Upload CSV
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleFileUpload}
            />
          </Button>
          {csvData && (
            <div style={{ marginTop: '16px' }}>
              <Typography variant="h6">CSV Preview</Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Event Name</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Event Payload</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Data Type</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.map((row, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.eventName}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.eventPayload}</td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.dataType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Button
            variant="contained"
            color="primary"
            style={{ marginTop: '16px', marginLeft:'8px',marginRight:'8px' }}
            onClick={generateCurl}
          >
            Generate CURL
          </Button>
          <Button
            variant="contained"
            color="secondary"
            style={{ marginTop: '16px', marginLeft: '8px' }}
            onClick={handleSubmit}
          >
            Submit
          </Button>
          {showConfirmation && (
            <Alert severity="info" style={{ marginTop: '16px' }}>
              <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{apiCurl}</pre>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityUploadApp;
