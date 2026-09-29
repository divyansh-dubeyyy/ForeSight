import pandas as pd
import pandera as pa
from pandera import Column, DataFrameSchema, Check

# Canonical Schema for Forecasts
ForecastSchema = DataFrameSchema({
    "issue_time": Column(pd.DatetimeTZDtype(tz="UTC") if pd.Series([pd.Timestamp('2020-01-01', tz='UTC')]).dtype.name != 'datetime64[ns]' else 'datetime64[ns]', coerce=True),
    "valid_time": Column(pd.DatetimeTZDtype(tz="UTC") if pd.Series([pd.Timestamp('2020-01-01', tz='UTC')]).dtype.name != 'datetime64[ns]' else 'datetime64[ns]', coerce=True),
    "lead_time_hours": Column(int, Check.ge(0)),
    "region": Column(str),
    "forecast_rainfall_mm": Column(float, Check.ge(0.0)), # Quality check: no negative rainfall
    "run_id": Column(str)
})

# Canonical Schema for Observations
ObservationSchema = DataFrameSchema({
    "valid_time": Column(pd.DatetimeTZDtype(tz="UTC") if pd.Series([pd.Timestamp('2020-01-01', tz='UTC')]).dtype.name != 'datetime64[ns]' else 'datetime64[ns]', coerce=True),
    "region": Column(str),
    "observed_rainfall_mm": Column(float, Check.ge(0.0))
})

# Canonical Schema for Aligned Dataset
AlignedSchema = DataFrameSchema({
    "issue_time": Column('datetime64[ns]', coerce=True),
    "valid_time": Column('datetime64[ns]', coerce=True),
    "lead_time_hours": Column(int, Check.ge(0)),
    "region": Column(str),
    "forecast_rainfall_mm": Column(float, Check.ge(0.0)),
    "observed_rainfall_mm": Column(float, Check.ge(0.0)),
    "error_mm": Column(float),
    "run_id": Column(str)
})

def validate_forecasts(df: pd.DataFrame) -> pd.DataFrame:
    # Ensure types before pandera validation for datetime
    df['issue_time'] = pd.to_datetime(df['issue_time'])
    df['valid_time'] = pd.to_datetime(df['valid_time'])
    # Quality check: replace negative rainfall with 0
    df.loc[df['forecast_rainfall_mm'] < 0, 'forecast_rainfall_mm'] = 0.0
    return ForecastSchema.validate(df)

def validate_observations(df: pd.DataFrame) -> pd.DataFrame:
    df['valid_time'] = pd.to_datetime(df['valid_time'])
    df.loc[df['observed_rainfall_mm'] < 0, 'observed_rainfall_mm'] = 0.0
    return ObservationSchema.validate(df)
    
def validate_aligned(df: pd.DataFrame) -> pd.DataFrame:
    df['issue_time'] = pd.to_datetime(df['issue_time'])
    df['valid_time'] = pd.to_datetime(df['valid_time'])
    return AlignedSchema.validate(df)
