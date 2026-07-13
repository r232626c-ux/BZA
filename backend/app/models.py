from sqlalchemy import (
    Column, Integer, String, Date, DateTime,
    ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship
from datetime import datetime
from passlib.hash import bcrypt
from sqlalchemy.sql import func
from passlib.context import CryptContext
from app.database import Base

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
   
    def verify_password(self, password: str) :
        return pwd_context.verify(password[:72], self.hashed_password)

    def set_password(self, password: str):
        self.hashed_password = pwd_context.hash(password)

    def get_password_hash(password: str):
        return pwd_context.hash(password[:72])

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50), nullable=False)
    action = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    dob = Column(Date)
    gender = Column(String)
    facility = Column(String)
    funding = Column(String)
    member_number = Column(String, nullable=True)
    member_suffix = Column(String, nullable=True)
    initials = Column(String, nullable=True)
    title = Column(String, nullable=True)
    id_number = Column(String, nullable=True)
    membership_status = Column(String, nullable=True)
    enrolment_status = Column(String, nullable=True)
    option = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    clinical_data = Column(String, nullable=True)
    request_id = Column(Integer, nullable=True)
    sample_date = Column(String, nullable=True)

    lab_requests = relationship(
        "LabRequest", back_populates="patient", cascade="all, delete"
    )
    lab_results = relationship(
        "LabResult", back_populates="patient", cascade="all, delete"
    )

class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, index=True, nullable=False)
    permission = Column(String, nullable=False)


class TestCategory(Base):
    __tablename__ = "test_categories"

    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    lab_tests = relationship("LabTest", back_populates="category_obj", cascade="all, delete")

class LabTest(Base):
    __tablename__ = "lab_tests"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    # Keep a human-readable category string for backwards compatibility
    category = Column(String, nullable=True)
    # Normalized category FK (optional)
    category_id = Column(Integer, ForeignKey("test_categories.id", ondelete="SET NULL"), nullable=True)

    # Relationship to normalized category (if present)
    category_obj = relationship("TestCategory", back_populates="lab_tests")

    lab_results = relationship(
        "LabResult", back_populates="lab_test", cascade="all, delete"
    )


class LabRequest(Base):
    __tablename__ = "lab_requests"

    id = Column(Integer, primary_key=True)
    patient_id = Column(
        Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    status = Column(String, default="Pending")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="lab_requests")
    lab_results = relationship(
        "LabResult", back_populates="lab_request", cascade="all, delete"
    )


class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True)
    lab_request_id = Column(
        Integer, ForeignKey("lab_requests.id", ondelete="CASCADE"), nullable=False
    )
    patient_id = Column(
        Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    lab_test_id = Column(
        Integer, ForeignKey("lab_tests.id", ondelete="CASCADE"), nullable=False
    )

    test_name = Column(String, nullable=False)
    results = Column(Text)
    unit = Column(String, nullable=True)
    ref_range = Column(String, nullable=True)
    flag = Column(String, nullable=True)
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="lab_results")
    lab_test = relationship("LabTest", back_populates="lab_results")
    lab_request = relationship("LabRequest", back_populates="lab_results")


class PaymentCode(Base):
    __tablename__ = "payment_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    validFrom = Column("validfrom", Date, nullable=False)  # Start of 2-month period
    validUntil = Column("validuntil", Date, nullable=False)  # End of 2-month period
    period = Column(String, nullable=False)  # e.g., "FEB-MAR-2026"
    licenseType = Column("licensetype", String, default="STANDARD")  # STANDARD, DEMO, ENTERPRISE, etc.
    isUsed = Column("isused", Boolean, default=False)
    usedDate = Column("useddate", DateTime, nullable=True)
    description = Column(String, nullable=True)  # e.g., "Q1 2026 License"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    labName = Column(String, default="BIOZONE Lab")
    turnaroundTime = Column(String, default="24")
    enableNotifications = Column(Boolean, default=True)
    maintenanceMode = Column(Boolean, default=False)
    defaultReportFormat = Column(String, default="PDF")
    dataRetentionDays = Column(Integer, default=365)
    lastPaymentDate = Column(DateTime, nullable=True)
    paymentStatus = Column(String, default="inactive")
    verificationCode = Column(String, nullable=True)  # Hashed verification code
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    recipient = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="sent")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, nullable=False)
    patient_email = Column(String, nullable=False)
    appointment_datetime = Column(DateTime, nullable=False)
    doctor = Column(String, nullable=True)
    type = Column(String, default="Lab Test")
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
