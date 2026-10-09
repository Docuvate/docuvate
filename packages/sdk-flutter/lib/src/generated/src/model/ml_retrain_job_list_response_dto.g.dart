// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ml_retrain_job_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MlRetrainJobListResponseDto extends MlRetrainJobListResponseDto {
  @override
  final BuiltList<MlRetrainJobDto> jobs;

  factory _$MlRetrainJobListResponseDto(
          [void Function(MlRetrainJobListResponseDtoBuilder)? updates]) =>
      (new MlRetrainJobListResponseDtoBuilder()..update(updates))._build();

  _$MlRetrainJobListResponseDto._({required this.jobs}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        jobs, r'MlRetrainJobListResponseDto', 'jobs');
  }

  @override
  MlRetrainJobListResponseDto rebuild(
          void Function(MlRetrainJobListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MlRetrainJobListResponseDtoBuilder toBuilder() =>
      new MlRetrainJobListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MlRetrainJobListResponseDto && jobs == other.jobs;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, jobs.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MlRetrainJobListResponseDto')
          ..add('jobs', jobs))
        .toString();
  }
}

class MlRetrainJobListResponseDtoBuilder
    implements
        Builder<MlRetrainJobListResponseDto,
            MlRetrainJobListResponseDtoBuilder> {
  _$MlRetrainJobListResponseDto? _$v;

  ListBuilder<MlRetrainJobDto>? _jobs;
  ListBuilder<MlRetrainJobDto> get jobs =>
      _$this._jobs ??= new ListBuilder<MlRetrainJobDto>();
  set jobs(ListBuilder<MlRetrainJobDto>? jobs) => _$this._jobs = jobs;

  MlRetrainJobListResponseDtoBuilder() {
    MlRetrainJobListResponseDto._defaults(this);
  }

  MlRetrainJobListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _jobs = $v.jobs.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MlRetrainJobListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$MlRetrainJobListResponseDto;
  }

  @override
  void update(void Function(MlRetrainJobListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MlRetrainJobListResponseDto build() => _build();

  _$MlRetrainJobListResponseDto _build() {
    _$MlRetrainJobListResponseDto _$result;
    try {
      _$result = _$v ?? new _$MlRetrainJobListResponseDto._(jobs: jobs.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'jobs';
        jobs.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'MlRetrainJobListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
