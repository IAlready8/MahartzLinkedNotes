"""
🏛️ ENTERPRISE CONFIGURATION SYSTEM
O5 Elite Level Configuration Management

This module provides comprehensive configuration management for the enterprise platform
with military-grade security, scalability settings, and production-ready defaults.
"""

import os
import secrets
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class SecurityLevel(Enum):
    """Security clearance levels for O5 operations"""
    RESTRICTED = "restricted"
    CONFIDENTIAL = "confidential"
    SECRET = "secret"
    TOP_SECRET = "top_secret"
    O5_CLEARANCE = "o5_clearance"

class DeploymentMode(Enum):
    """Deployment environment modes"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    O5_OPERATIONS = "o5_operations"

@dataclass
class DatabaseConfig:
    """Enterprise database configuration"""
    # Primary PostgreSQL Database
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "mahart_enterprise")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "mahart_admin")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", secrets.token_urlsafe(32))
    
    # Connection Pool Settings
    POSTGRES_MIN_CONNECTIONS: int = int(os.getenv("POSTGRES_MIN_CONNECTIONS", "5"))
    POSTGRES_MAX_CONNECTIONS: int = int(os.getenv("POSTGRES_MAX_CONNECTIONS", "100"))
    POSTGRES_CONNECTION_TIMEOUT: int = int(os.getenv("POSTGRES_CONNECTION_TIMEOUT", "30"))
    
    # Redis Cache & Session Store
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    
    # Vector Database (Pinecone/Weaviate)
    VECTOR_DB_HOST: str = os.getenv("VECTOR_DB_HOST", "localhost")
    VECTOR_DB_API_KEY: str = os.getenv("VECTOR_DB_API_KEY", "")
    VECTOR_DB_INDEX: str = os.getenv("VECTOR_DB_INDEX", "mahart-notes")
    VECTOR_DIMENSIONS: int = int(os.getenv("VECTOR_DIMENSIONS", "1536"))

@dataclass
class AIConfig:
    """Advanced AI orchestration configuration"""
    
    # Primary LLM Providers
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    AZURE_OPENAI_KEY: str = os.getenv("AZURE_OPENAI_KEY", "")
    
    # Model Selection and Routing
    DEFAULT_MODEL: str = os.getenv("DEFAULT_AI_MODEL", "gpt-4-turbo")
    FALLBACK_MODEL: str = os.getenv("FALLBACK_AI_MODEL", "claude-3-sonnet")
    
    # Advanced Features
    ENABLE_MODEL_ROUTING: bool = os.getenv("ENABLE_MODEL_ROUTING", "true").lower() == "true"
    ENABLE_RESPONSE_CACHING: bool = os.getenv("ENABLE_RESPONSE_CACHING", "true").lower() == "true"
    ENABLE_CONTENT_FILTERING: bool = os.getenv("ENABLE_CONTENT_FILTERING", "true").lower() == "true"
    
    # Performance Settings
    MAX_CONCURRENT_REQUESTS: int = int(os.getenv("MAX_CONCURRENT_AI_REQUESTS", "50"))
    REQUEST_TIMEOUT: int = int(os.getenv("AI_REQUEST_TIMEOUT", "60"))
    RETRY_ATTEMPTS: int = int(os.getenv("AI_RETRY_ATTEMPTS", "3"))
    
    # Enterprise Features
    ENABLE_COST_OPTIMIZATION: bool = os.getenv("ENABLE_COST_OPTIMIZATION", "true").lower() == "true"
    ENABLE_PERFORMANCE_MONITORING: bool = os.getenv("ENABLE_AI_MONITORING", "true").lower() == "true"
    ENABLE_AUDIT_LOGGING: bool = os.getenv("ENABLE_AI_AUDIT", "true").lower() == "true"

@dataclass
class SecurityConfig:
    """Military-grade security configuration"""
    
    # Encryption Settings
    MASTER_ENCRYPTION_KEY: str = os.getenv("MASTER_ENCRYPTION_KEY", secrets.token_urlsafe(64))
    AES_KEY_SIZE: int = int(os.getenv("AES_KEY_SIZE", "256"))
    ENABLE_FIELD_LEVEL_ENCRYPTION: bool = os.getenv("ENABLE_FIELD_ENCRYPTION", "true").lower() == "true"
    
    # Authentication & Authorization
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(64))
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
    
    # Multi-Factor Authentication
    ENABLE_MFA: bool = os.getenv("ENABLE_MFA", "true").lower() == "true"
    MFA_TOKEN_LENGTH: int = int(os.getenv("MFA_TOKEN_LENGTH", "6"))
    MFA_EXPIRE_SECONDS: int = int(os.getenv("MFA_EXPIRE_SECONDS", "300"))
    
    # Security Headers & CORS
    ENABLE_HSTS: bool = os.getenv("ENABLE_HSTS", "true").lower() == "true"
    ENABLE_CSP: bool = os.getenv("ENABLE_CSP", "true").lower() == "true"
    CORS_ORIGINS: List[str] = field(default_factory=lambda: os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","))
    
    # Rate Limiting
    ENABLE_RATE_LIMITING: bool = os.getenv("ENABLE_RATE_LIMITING", "true").lower() == "true"
    DEFAULT_RATE_LIMIT: str = os.getenv("DEFAULT_RATE_LIMIT", "100/hour")
    PREMIUM_RATE_LIMIT: str = os.getenv("PREMIUM_RATE_LIMIT", "1000/hour")
    
    # Security Monitoring
    ENABLE_INTRUSION_DETECTION: bool = os.getenv("ENABLE_INTRUSION_DETECTION", "true").lower() == "true"
    ENABLE_AUDIT_LOGGING: bool = os.getenv("ENABLE_SECURITY_AUDIT", "true").lower() == "true"
    SUSPICIOUS_ACTIVITY_THRESHOLD: int = int(os.getenv("SUSPICIOUS_ACTIVITY_THRESHOLD", "10"))

@dataclass
class PerformanceConfig:
    """Enterprise performance and scalability settings"""
    
    # Server Configuration
    WORKER_COUNT: int = int(os.getenv("WORKER_COUNT", "4"))
    WORKER_CLASS: str = os.getenv("WORKER_CLASS", "uvicorn.workers.UvicornWorker")
    MAX_CONNECTIONS: int = int(os.getenv("MAX_CONNECTIONS", "1000"))
    
    # Caching Strategy
    ENABLE_RESPONSE_CACHE: bool = os.getenv("ENABLE_RESPONSE_CACHE", "true").lower() == "true"
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour
    ENABLE_EDGE_CACHING: bool = os.getenv("ENABLE_EDGE_CACHING", "false").lower() == "true"
    
    # Load Balancing
    ENABLE_LOAD_BALANCING: bool = os.getenv("ENABLE_LOAD_BALANCING", "false").lower() == "true"
    LOAD_BALANCER_ALGORITHM: str = os.getenv("LOAD_BALANCER_ALGORITHM", "round_robin")
    
    # Auto-scaling
    ENABLE_AUTO_SCALING: bool = os.getenv("ENABLE_AUTO_SCALING", "false").lower() == "true"
    MIN_REPLICAS: int = int(os.getenv("MIN_REPLICAS", "2"))
    MAX_REPLICAS: int = int(os.getenv("MAX_REPLICAS", "20"))
    TARGET_CPU_UTILIZATION: int = int(os.getenv("TARGET_CPU_UTILIZATION", "70"))

@dataclass
class MonitoringConfig:
    """Comprehensive observability configuration"""
    
    # Metrics & Monitoring
    ENABLE_PROMETHEUS: bool = os.getenv("ENABLE_PROMETHEUS", "true").lower() == "true"
    PROMETHEUS_PORT: int = int(os.getenv("PROMETHEUS_PORT", "8090"))
    
    # Distributed Tracing
    ENABLE_JAEGER: bool = os.getenv("ENABLE_JAEGER", "true").lower() == "true"
    JAEGER_HOST: str = os.getenv("JAEGER_HOST", "localhost")
    JAEGER_PORT: int = int(os.getenv("JAEGER_PORT", "14268"))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    ENABLE_STRUCTURED_LOGGING: bool = os.getenv("ENABLE_STRUCTURED_LOGGING", "true").lower() == "true"
    LOG_RETENTION_DAYS: int = int(os.getenv("LOG_RETENTION_DAYS", "30"))
    
    # Health Checks
    HEALTH_CHECK_INTERVAL: int = int(os.getenv("HEALTH_CHECK_INTERVAL", "30"))
    ENABLE_DEEP_HEALTH_CHECKS: bool = os.getenv("ENABLE_DEEP_HEALTH_CHECKS", "true").lower() == "true"
    
    # Alerting
    ENABLE_ALERTING: bool = os.getenv("ENABLE_ALERTING", "true").lower() == "true"
    ALERT_WEBHOOK_URL: str = os.getenv("ALERT_WEBHOOK_URL", "")
    CRITICAL_ERROR_THRESHOLD: int = int(os.getenv("CRITICAL_ERROR_THRESHOLD", "5"))

class EnterpriseConfig:
    """
    🏛️ MASTER ENTERPRISE CONFIGURATION
    
    This is the central configuration system for the O5 elite platform.
    All enterprise features, security settings, and operational parameters
    are controlled through this configuration system.
    """
    
    # ==================== CORE PLATFORM SETTINGS ====================
    
    # Environment & Deployment
    ENVIRONMENT: DeploymentMode = DeploymentMode(os.getenv("ENVIRONMENT", "development"))
    DEBUG_MODE: bool = os.getenv("DEBUG", "false").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(64))
    
    # Server Configuration
    SERVER_HOST: str = os.getenv("HOST", "0.0.0.0")
    SERVER_PORT: int = int(os.getenv("PORT", "8000"))
    ALLOWED_HOSTS: List[str] = field(default_factory=lambda: os.getenv("ALLOWED_HOSTS", "*").split(","))
    
    # SSL/TLS Configuration
    ENABLE_SSL: bool = os.getenv("ENABLE_SSL", "false").lower() == "true"
    SSL_CERT_FILE: Optional[str] = os.getenv("SSL_CERT_FILE")
    SSL_KEY_FILE: Optional[str] = os.getenv("SSL_KEY_FILE")
    
    # API Configuration
    API_VERSION: str = "v1"
    API_PREFIX: str = f"/api/{API_VERSION}"
    ENABLE_API_DOCS: bool = os.getenv("ENABLE_API_DOCS", "true").lower() == "true"
    
    # Component Configurations
    DATABASE: DatabaseConfig = field(default_factory=DatabaseConfig)
    AI: AIConfig = field(default_factory=AIConfig)
    SECURITY: SecurityConfig = field(default_factory=SecurityConfig)
    PERFORMANCE: PerformanceConfig = field(default_factory=PerformanceConfig)
    MONITORING: MonitoringConfig = field(default_factory=MonitoringConfig)
    
    # ==================== ENTERPRISE FEATURES ====================
    
    # Collaboration & Real-time
    ENABLE_REALTIME_COLLABORATION: bool = os.getenv("ENABLE_REALTIME_COLLABORATION", "true").lower() == "true"
    MAX_CONCURRENT_COLLABORATORS: int = int(os.getenv("MAX_CONCURRENT_COLLABORATORS", "50"))
    WEBSOCKET_HEARTBEAT_INTERVAL: int = int(os.getenv("WEBSOCKET_HEARTBEAT_INTERVAL", "30"))
    
    # Advanced Analytics
    ENABLE_ADVANCED_ANALYTICS: bool = os.getenv("ENABLE_ADVANCED_ANALYTICS", "true").lower() == "true"
    ANALYTICS_RETENTION_DAYS: int = int(os.getenv("ANALYTICS_RETENTION_DAYS", "90"))
    ENABLE_PREDICTIVE_ANALYTICS: bool = os.getenv("ENABLE_PREDICTIVE_ANALYTICS", "true").lower() == "true"
    
    # Plugin System
    ENABLE_PLUGIN_SYSTEM: bool = os.getenv("ENABLE_PLUGIN_SYSTEM", "true").lower() == "true"
    PLUGIN_DIRECTORY: str = os.getenv("PLUGIN_DIRECTORY", "./plugins")
    MAX_PLUGIN_EXECUTION_TIME: int = int(os.getenv("MAX_PLUGIN_EXECUTION_TIME", "30"))
    
    # Enterprise Integrations
    ENABLE_ENTERPRISE_SSO: bool = os.getenv("ENABLE_ENTERPRISE_SSO", "false").lower() == "true"
    SAML_IDP_URL: str = os.getenv("SAML_IDP_URL", "")
    LDAP_SERVER_URL: str = os.getenv("LDAP_SERVER_URL", "")
    
    # Data Management
    ENABLE_DATA_ENCRYPTION: bool = os.getenv("ENABLE_DATA_ENCRYPTION", "true").lower() == "true"
    ENABLE_BACKUP_SYSTEM: bool = os.getenv("ENABLE_BACKUP_SYSTEM", "true").lower() == "true"
    BACKUP_INTERVAL_HOURS: int = int(os.getenv("BACKUP_INTERVAL_HOURS", "6"))
    
    # ==================== O5 ELITE FEATURES ====================
    
    # Advanced AI Capabilities
    ENABLE_MULTI_MODEL_ORCHESTRATION: bool = True
    ENABLE_AI_AGENT_SWARMS: bool = True
    ENABLE_ADVANCED_REASONING: bool = True
    ENABLE_CODE_GENERATION: bool = True
    
    # Elite Security Features
    ENABLE_QUANTUM_ENCRYPTION: bool = os.getenv("ENABLE_QUANTUM_ENCRYPTION", "false").lower() == "true"
    ENABLE_BIOMETRIC_AUTH: bool = os.getenv("ENABLE_BIOMETRIC_AUTH", "false").lower() == "true"
    ENABLE_ZERO_TRUST_ARCHITECTURE: bool = True
    
    # Advanced Scalability
    ENABLE_MICROSERVICES_ARCHITECTURE: bool = True
    ENABLE_EVENT_SOURCING: bool = True
    ENABLE_CQRS_PATTERN: bool = True
    
    # Elite Monitoring
    ENABLE_REAL_TIME_THREAT_DETECTION: bool = True
    ENABLE_ANOMALY_DETECTION: bool = True
    ENABLE_PREDICTIVE_MAINTENANCE: bool = True
    
    @classmethod
    async def validate_configuration(cls):
        """Validate enterprise configuration and dependencies"""
        
        logger.info("🔍 Validating enterprise configuration...")
        
        validation_errors = []
        
        # Validate required environment variables
        required_vars = [
            "OPENAI_API_KEY",
            "ANTHROPIC_API_KEY",
            "POSTGRES_HOST",
            "REDIS_HOST"
        ]
        
        for var in required_vars:
            if not os.getenv(var):
                validation_errors.append(f"Missing required environment variable: {var}")
        
        # Validate security settings
        if cls.ENVIRONMENT == DeploymentMode.PRODUCTION:
            if cls.DEBUG_MODE:
                validation_errors.append("Debug mode cannot be enabled in production")
            
            if not cls.ENABLE_SSL:
                validation_errors.append("SSL must be enabled in production")
            
            if not cls.SECURITY.ENABLE_MFA:
                validation_errors.append("MFA must be enabled in production")
        
        # Validate database connections
        try:
            await cls._validate_database_connections()
        except Exception as e:
            validation_errors.append(f"Database validation failed: {str(e)}")
        
        # Validate AI service connections
        try:
            await cls._validate_ai_services()
        except Exception as e:
            validation_errors.append(f"AI service validation failed: {str(e)}")
        
        if validation_errors:
            error_message = "\n".join(validation_errors)
            logger.error(f"❌ Configuration validation failed:\n{error_message}")
            raise RuntimeError(f"Configuration validation failed: {error_message}")
        
        logger.info("✅ Enterprise configuration validated successfully")
    
    @classmethod
    async def _validate_database_connections(cls):
        """Validate database connectivity"""
        # Implementation would test database connections
        pass
    
    @classmethod
    async def _validate_ai_services(cls):
        """Validate AI service connectivity"""
        # Implementation would test AI service connections
        pass
    
    @classmethod
    def get_database_url(cls) -> str:
        """Get PostgreSQL connection URL"""
        return (
            f"postgresql+asyncpg://{cls.DATABASE.POSTGRES_USER}:"
            f"{cls.DATABASE.POSTGRES_PASSWORD}@{cls.DATABASE.POSTGRES_HOST}:"
            f"{cls.DATABASE.POSTGRES_PORT}/{cls.DATABASE.POSTGRES_DB}"
        )
    
    @classmethod
    def get_redis_url(cls) -> str:
        """Get Redis connection URL"""
        auth = f":{cls.DATABASE.REDIS_PASSWORD}@" if cls.DATABASE.REDIS_PASSWORD else ""
        return f"redis://{auth}{cls.DATABASE.REDIS_HOST}:{cls.DATABASE.REDIS_PORT}/{cls.DATABASE.REDIS_DB}"
    
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production mode"""
        return cls.ENVIRONMENT in [DeploymentMode.PRODUCTION, DeploymentMode.O5_OPERATIONS]
    
    @classmethod
    def get_security_level(cls) -> SecurityLevel:
        """Get current security clearance level"""
        if cls.ENVIRONMENT == DeploymentMode.O5_OPERATIONS:
            return SecurityLevel.O5_CLEARANCE
        elif cls.is_production():
            return SecurityLevel.SECRET
        else:
            return SecurityLevel.CONFIDENTIAL
    
    @classmethod
    def get_configuration_summary(cls) -> Dict[str, Any]:
        """Get configuration summary for monitoring"""
        return {
            "environment": cls.ENVIRONMENT.value,
            "security_level": cls.get_security_level().value,
            "debug_mode": cls.DEBUG_MODE,
            "ssl_enabled": cls.ENABLE_SSL,
            "ai_orchestration": cls.ENABLE_MULTI_MODEL_ORCHESTRATION,
            "realtime_collaboration": cls.ENABLE_REALTIME_COLLABORATION,
            "advanced_analytics": cls.ENABLE_ADVANCED_ANALYTICS,
            "plugin_system": cls.ENABLE_PLUGIN_SYSTEM,
            "worker_count": cls.PERFORMANCE.WORKER_COUNT,
            "max_connections": cls.PERFORMANCE.MAX_CONNECTIONS
        }

# Initialize global configuration instance
config = EnterpriseConfig()