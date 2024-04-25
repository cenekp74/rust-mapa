// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use core::f32;
use std::collections::HashMap;
use std::fs;
use serde::Serialize;

#[tauri::command]
fn get_data(filename: &str) -> String {
    let data = load_data(filename);
    match data {
        Err(_) => {return String::from("Data loading failed")}, // DODELAT CORRECT ERROR MESSAGES
        Ok(data) => {return serde_json::to_string(&data).expect("Data serializing failed")}
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// struct na ukladani bodu, ktery se pak zobrazi na mape
#[derive(Serialize)]
struct PointData {
    locations: Vec<(f32, f32)>,
    data: HashMap<String, Vec<f32>>
}

impl PointData {
    fn new() -> Self {
        PointData {
            locations: Vec::new(),
            data: HashMap::new()
        }
    }
}

enum DataLoadError {
    FileNotFound,
    FileInvalid,
}

fn load_data(filename: &str) -> Result<PointData, DataLoadError> {
    let contents_result = fs::read_to_string(filename);
    let contents = match contents_result {
        Err(_) => return Err(DataLoadError::FileNotFound),
        Ok(cont) => cont.replace("\r", ""),
    };
    let mut point_data = PointData::new();
    let lines: Vec<&str> = contents.split('\n').collect();

    for location in lines[0].split(',').skip(1) {
        let location = location.replace("[", "").replace("]", "");
        let location_split: Vec<&str> = location.split(";").collect();
        if location_split.len() != 2 {return Err(DataLoadError::FileInvalid)}
        let coord1_result = location_split[0].parse::<f32>();
        let coord1 = match coord1_result {
            Err(_) => return Err(DataLoadError::FileInvalid),
            Ok(coord1) => coord1,
        };
        let coord2_result = location_split[1].parse::<f32>();
        let coord2 = match coord2_result {
            Err(_) => return Err(DataLoadError::FileInvalid),
            Ok(coord2) => coord2,
        };
        point_data.locations.push((coord1, coord2));
    }
    
    for line in &lines[1..] {
        let line_split: Vec<&str> = line.split(",").collect();
        let datetime = String::from(line_split[0]);
        let mut data: Vec<f32> = Vec::new();
        for value_str in &line_split[1..] {
            let value_result = value_str.parse::<f32>();
            let value = match value_result {
                Err(_) => return Err(DataLoadError::FileInvalid),
                Ok(value) => value
            };
            data.push(value)
        }
        point_data.data.insert(datetime, data);
    }
    Ok(point_data)
}