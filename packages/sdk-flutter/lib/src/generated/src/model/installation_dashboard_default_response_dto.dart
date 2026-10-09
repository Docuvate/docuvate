//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/dashboard_widget_input_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'installation_dashboard_default_response_dto.g.dart';

/// InstallationDashboardDefaultResponseDto
///
/// Properties:
/// * [widgets] 
@BuiltValue()
abstract class InstallationDashboardDefaultResponseDto implements Built<InstallationDashboardDefaultResponseDto, InstallationDashboardDefaultResponseDtoBuilder> {
  @BuiltValueField(wireName: r'widgets')
  BuiltList<DashboardWidgetInputDto> get widgets;

  InstallationDashboardDefaultResponseDto._();

  factory InstallationDashboardDefaultResponseDto([void updates(InstallationDashboardDefaultResponseDtoBuilder b)]) = _$InstallationDashboardDefaultResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InstallationDashboardDefaultResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InstallationDashboardDefaultResponseDto> get serializer => _$InstallationDashboardDefaultResponseDtoSerializer();
}

class _$InstallationDashboardDefaultResponseDtoSerializer implements PrimitiveSerializer<InstallationDashboardDefaultResponseDto> {
  @override
  final Iterable<Type> types = const [InstallationDashboardDefaultResponseDto, _$InstallationDashboardDefaultResponseDto];

  @override
  final String wireName = r'InstallationDashboardDefaultResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InstallationDashboardDefaultResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'widgets';
    yield serializers.serialize(
      object.widgets,
      specifiedType: const FullType(BuiltList, [FullType(DashboardWidgetInputDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    InstallationDashboardDefaultResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required InstallationDashboardDefaultResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'widgets':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DashboardWidgetInputDto)]),
          ) as BuiltList<DashboardWidgetInputDto>;
          result.widgets.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  InstallationDashboardDefaultResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InstallationDashboardDefaultResponseDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

